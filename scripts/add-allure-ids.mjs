/**
 * Injects stable await allure.allureId('PREFIX-NNN') calls into every test body.
 * Covers both *.spec.ts and *.unit.ts files.
 * Safe to re-run - skips tests that already have allure.allureId().
 */

import { readFileSync, writeFileSync, globSync } from 'fs';
import { relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'tests');

const PREFIX_MAP = [
  // spec files
  { match: 'accessibility/a11y',                        prefix: 'A11Y'     },
  { match: 'api/playwright-site',                       prefix: 'API'      },
  { match: 'components/playwrightdev/code-block',       prefix: 'COMP-CB'  },
  { match: 'components/playwrightdev/footer',           prefix: 'COMP-FT'  },
  { match: 'components/playwrightdev/language-selector',prefix: 'COMP-LS'  },
  { match: 'components/playwrightdev/navbar',           prefix: 'COMP-NB'  },
  { match: 'components/playwrightdev/search',           prefix: 'COMP-SR'  },
  { match: 'crawler/crawler',                           prefix: 'CRWL'     },
  { match: 'mocking/playwrightdev/api-mocking',         prefix: 'MOCK-API' },
  { match: 'mocking/playwrightdev/network-conditions',  prefix: 'MOCK-NET' },
  { match: 'multi-context/saucedemo/multi-tab',         prefix: 'CTX-TAB'  },
  { match: 'multi-context/saucedemo/multi-user',        prefix: 'CTX-USR'  },
  { match: 'multi-context/saucedemo/multi-window',      prefix: 'CTX-WIN'  },
  { match: 'performance/performance',                   prefix: 'PERF'     },
  { match: 'security/security',                         prefix: 'SEC'      },
  { match: 'ui/playwrightdev/docs-page',                prefix: 'UI-DP'    },
  { match: 'ui/playwrightdev/home-page',                prefix: 'UI-HP'    },
  { match: 'ui/saucedemo/checkout',                     prefix: 'UI-CK'    },
  { match: 'ui/saucedemo/inventory',                    prefix: 'UI-INV'   },
  { match: 'ui/saucedemo/login',                        prefix: 'UI-LG'    },
  { match: 'visual/playwrightdev/docs-page',            prefix: 'VIS-DP'   },
  { match: 'visual/playwrightdev/home-page',            prefix: 'VIS-HP'   },
  { match: 'websocket/saucedemo/ws-mock',               prefix: 'WS-MOCK'  },
  { match: 'websocket/saucedemo/ws-realtime',           prefix: 'WS-REAL'  },
  // unit files
  { match: 'unit/accessibility',                        prefix: 'UNIT-A11Y'},
  { match: 'unit/authentication',                       prefix: 'UNIT-AUTH'},
  { match: 'unit/mock',                                 prefix: 'UNIT-MOCK'},
  { match: 'unit/multi-context',                        prefix: 'UNIT-CTX' },
  { match: 'unit/performance',                          prefix: 'UNIT-PERF'},
  { match: 'unit/security',                             prefix: 'UNIT-SEC' },
  { match: 'unit/visual',                               prefix: 'UNIT-VIS' },
  { match: 'unit/websocket',                            prefix: 'UNIT-WS'  },
];

function getPrefixForFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  for (const { match, prefix } of PREFIX_MAP) {
    if (norm.includes(match)) return prefix;
  }
  return 'TEST';
}

function findNextTestCall(src, from) {
  let idx = from;
  while (idx < src.length) {
    const pos = src.indexOf('test(', idx);
    if (pos === -1) return -1;
    const before = pos > 0 ? src[pos - 1] : ' ';
    if (before !== '.' && /[\s;{},(\[]/.test(before)) return pos;
    idx = pos + 1;
  }
  return -1;
}

// Returns the '{' that opens the test body — the FIRST async arrow at depth=1
// inside test() args, so nested step-callback arrows are never picked up.
function findTestBodyBrace(src, from) {
  let i = from;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;

  if (src[i] !== '(') return -1;

  while (i < src.length) {
    const ch = src[i];
    if (inString) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === stringChar) inString = false;
      i++; continue;
    }
    if (inTemplate) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === '`') inTemplate = false;
      i++; continue;
    }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; i++; continue; }
    if (ch === '`') { inTemplate = true; i++; continue; }
    if (ch === '(') { depth++; i++; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0) return -1;
      i++; continue;
    }
    if (ch === '=' && src[i + 1] === '>' && depth === 1) {
      let j = i + 2;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === '{') return j;
      i = j; continue;
    }
    i++;
  }
  return -1;
}

function injectIds(src, prefix) {
  let counter = 0;
  let changed = false;
  const out = [];
  let i = 0;

  while (i < src.length) {
    const testIdx = findNextTestCall(src, i);
    if (testIdx === -1) { out.push(src.slice(i)); break; }

    out.push(src.slice(i, testIdx + 4));
    i = testIdx + 4;

    const bodyBrace = findTestBodyBrace(src, i);
    if (bodyBrace === -1) continue;

    out.push(src.slice(i, bodyBrace + 1));
    i = bodyBrace + 1;

    const lookahead = src.slice(i, i + 300);
    if (lookahead.includes('allure.allureId(')) continue;

    const lineStart = src.lastIndexOf('\n', bodyBrace);
    const lineContent = src.slice(lineStart + 1, bodyBrace + 1);
    const indent = (lineContent.match(/^(\s*)/)?.[1] ?? '') + '  ';

    counter++;
    const id = prefix + '-' + String(counter).padStart(3, '0');
    out.push('\n' + indent + "await allure.allureId('" + id + "');");
    changed = true;
  }

  return changed ? out.join('') : null;
}

function ensureAllureImport(src) {
  if (src.includes("from 'allure-js-commons'") || src.includes('from "allure-js-commons"')) return src;
  const lastImport = src.lastIndexOf('\nimport ');
  if (lastImport === -1) return "import * as allure from 'allure-js-commons';\n" + src;
  const endOfLine = src.indexOf('\n', lastImport + 1);
  return src.slice(0, endOfLine + 1) + "import * as allure from 'allure-js-commons';\n" + src.slice(endOfLine + 1);
}

const rootNorm = ROOT.replace(/\\/g, '/');
const files = [
  ...globSync(rootNorm + '/**/*.spec.ts'),
  ...globSync(rootNorm + '/**/*.unit.ts'),
].sort();

console.log('Found ' + files.length + ' test files.\n');

let totalIds = 0;

for (const filePath of files) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  const prefix = getPrefixForFile(filePath);
  let src = readFileSync(filePath, 'utf8');

  const withImport = ensureAllureImport(src);
  const importAdded = withImport !== src;
  src = withImport;

  const result = injectIds(src, prefix);

  if (result !== null || importAdded) {
    const final = result ?? src;
    writeFileSync(filePath, final, 'utf8');
    const count = (final.match(/await allure\.allureId\(/g) || []).length;
    totalIds += count;
    console.log('UPDATED ' + rel + '  [' + prefix + '] - ' + count + ' IDs' + (importAdded ? ', import added' : ''));
  } else {
    const count = (src.match(/await allure\.allureId\(/g) || []).length;
    totalIds += count;
    console.log('OK      ' + rel + '  - already up to date (' + count + ' IDs)');
  }
}

console.log('\nDone. ' + totalIds + ' total allure IDs across ' + files.length + ' files.');
