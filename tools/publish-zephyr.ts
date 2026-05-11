import fs from "node:fs";
import path from "node:path";
import { config } from "../configs/config";

const projectTag = 'RSCD';

type ZephyrExecution = {
    id: number;
    issueKey?: string;
};

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var ${name}`);
    return v;
}

async function httpJson(url: string, opts: Parameters<typeof fetch>[1]): Promise<any> {
    const res = await fetch(url, opts);
    const text = await res.text();

    if(!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${text.slice(0,5000)}`);
    }

    if (!text.trim()) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function bearerAuthHeader(token: string, extra?: Record<string, string>) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: `application/json`,
        "X-Requested-With": "XMLHttpRequest",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://staff.loc.gov/tasks",
        "Origin": "https//staff.loc.gov",
        ...(extra ?? {}),
    };
}

function mapOutcomeToZephyrStatus(outcome: string): string {
    if (outcome === "passed") return "1";
    if (outcome === "failed") return "2";
    return "4";
}

function extractAllZephyrKeysFromTags(tags: string[]): string[] {
    const keys: string[] = [];
    const regexToUse = new RegExp(`@?(${projectTag}-\\d+)$`, `i`);
    for (const t of tags ?? []) {
        const m = t.match(regexToUse);
        if (m?.[1]) keys.push(m[1].toUpperCase());
    }
    return keys;
}

function collectPlaywrightTest(report: any): Array<{ title: string, tags: string[]; outcome: string}> {
    const out: Array<{ title: string; tags: string[]; outcome: string }> = [];

    function walkSuites(suites: any[]) {
        for (const s of suites ?? []) {
            walkSuites(s.suites);
            for (const spec of s.specs ?? []) {
                for (const t of spec.tests ?? []) {
                    const lastResult = (t.results && t.results.length) ? t.results[t.results.length - 1] : null;
                    const outcome = t.outcome ?? lastResult?.status ?? "skipped";

                    out.push({
                        title: spec.title ?? t.title ?? "unknown",
                        tags: t.tags ?? spec.tags ?? [],
                        outcome: String(outcome), // FIXED: was semicolon
                    })
                }
            }
        }
    }

    walkSuites(report?.suites ?? []);
    return out;
}

async function listExecutionInCycle(
    baseUrl: string,
    token: string,
    projectId: string,
    versionId: string,
    cycleId: string
): Promise<ZephyrExecution[]> {
    const all: ZephyrExecution[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
        const url = 
        `${baseUrl}/rest/zapi/latest/execution` +
        `?cycleId=${encodeURIComponent(cycleId)}` +
        `&action=expanded` +
        `&projectId=${encodeURIComponent(projectId)}` +
        `&versionId=${encodeURIComponent(versionId)}` +
        `&limit=${limit}` +
        `&offset=${offset}` +
        `&sorter=OrderId:ASC`;

        const json = await httpJson(url, {
            method: "GET",
            headers: bearerAuthHeader(token),
        });

        const executions = Array.isArray(json?.executions) ? json.executions : [];

        for (const e of executions) {
            if (!e?.id || !e?.issueKey) continue;
            all.push({ id: Number(e.id), issueKey: e.issueKey.toUpperCase() });
        }

        if (executions.length < limit) break;
        offset += limit;
    }

    return all;
}

async function updateExecutionStatus(baseUrl: string, token: string, executionId: number, zephyrStatus: string) {
    const url = `${baseUrl}/rest/zapi/latest/executions/${executionId}/execute`;

    await httpJson(url, {
        method: 'PUT',
        headers: bearerAuthHeader(token, { "Content-Type": "application/json"}),
        body: JSON.stringify({
            status: zephyrStatus,
            changeAssignee: false
        }),
    });
}

async function main() {
    const token = requireEnv("ZEPHYR_TOKEN");

    const baseUrl = config.jira_base_url.replace(/\/$/, "");
    const projectId = config.zephyr_project_id;
    const versionId = config.zephyr_version_id;
    const cycleId = config.zephyr_cycle_id;

    const jsonPath = process.env.JUNIT_PATH ?? "playwright-report/results.json";
    const resolvedJsonPath = path.resolve(jsonPath);

    // FIXED: log before reading, not after
    console.log(`Reading Playwright JSON from ${resolvedJsonPath}`);
    const reportRaw = fs.readFileSync(resolvedJsonPath, "utf-8");
    const report = JSON.parse(reportRaw);

    const tests = collectPlaywrightTest(report);

    const desiredByKey = new Map<string, string>();

    for (const t of tests) {
        // FIXED: extract ALL keys from tags, not just the first
        const keys = extractAllZephyrKeysFromTags(t.tags);
        if (keys.length === 0) continue;

        const status = mapOutcomeToZephyrStatus(t.outcome);

        for (const key of keys) {
            const existing = desiredByKey.get(key);
            if (!existing) desiredByKey.set(key, status);
            // If any run failed, mark the key as failed
            else if (existing !== "2" && status === "2") desiredByKey.set(key, "2");
        }
    }

    if (desiredByKey.size === 0) {
        console.log(`No ${projectTag}-#### keys found in JUnit tags`);
        process.exit(0);
    }

    console.log(`Found ${desiredByKey.size} Zephyr-mapped tests in results.`);

    const executions = await listExecutionInCycle(baseUrl, token, projectId, versionId, cycleId);

    const execByIssueKey = new Map<string, number>();
    for (const e of executions) {
        if (e.issueKey) execByIssueKey.set(e.issueKey.toUpperCase(), e.id);
    }

    let updated = 0;
    let missed = 0;

    for (const [issueKey, zephyrStatus] of desiredByKey.entries()) {
        const executionId = execByIssueKey.get(issueKey.toUpperCase());

        if (!executionId) {
            missed++;
            console.warn(`No execution found in cycle ${cycleId} for ${issueKey}`); // FIXED: typo "cyccle"
            continue;
        }

        await updateExecutionStatus(baseUrl, token, executionId, zephyrStatus);
        updated++;
        console.log(`Updated ${issueKey} execution ${executionId} => status ${zephyrStatus}`);
    }

    console.log(`Done. Updated ${updated} executions. Missing-in-cycle: ${missed}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});