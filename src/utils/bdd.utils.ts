import * as allure from 'allure-js-commons';

/**
 * bdd.utils
 * ---------------------------------------------------------------------------
 * Lightweight Gherkin-style step wrappers around Allure's native step API.
 *
 * We don't run Cucumber -- there's no .feature file / step-definition
 * indirection -- but the team still wants Allure reports that *read* like a
 * Cucumber scenario (Given/When/Then nesting under a scenario title). Each
 * helper below is a thin pass-through to `allure.step()` that prefixes the
 * step title with its Gherkin keyword, so the report tree renders the same
 * shape a cucumber-js + allure-cucumberjs run would produce, without any of
 * that toolchain.
 */

type StepBody<T> = () => Promise<T> | T;

async function keywordStep<T>(keyword: string, text: string, body: StepBody<T>): Promise<T> {
  return Promise.resolve(allure.step(`${keyword} ${text}`, body));
}

/** Sets up the initial context ("Given a logged-in user..."). */
export const Given = <T>(text: string, body: StepBody<T>): Promise<T> => keywordStep('Given', text, body);

/** Performs the action under test ("When the user submits the form..."). */
export const When = <T>(text: string, body: StepBody<T>): Promise<T> => keywordStep('When', text, body);

/** Asserts the expected outcome ("Then an error message is shown..."). */
export const Then = <T>(text: string, body: StepBody<T>): Promise<T> => keywordStep('Then', text, body);

/** Continues the previous keyword (Given/When/Then) with another clause. */
export const And = <T>(text: string, body: StepBody<T>): Promise<T> => keywordStep('And', text, body);

/** Continues the previous keyword with a contrasting clause. */
export const But = <T>(text: string, body: StepBody<T>): Promise<T> => keywordStep('But', text, body);

/**
 * Groups Given/When/Then calls under a top-level "Scenario:" step and
 * records the title as the Allure step name, mirroring how a Cucumber
 * report nests steps beneath their scenario. Also sets the Allure "story"
 * label to the same title, so it only needs to be written once.
 */
export async function Scenario<T>(title: string, body: StepBody<T>): Promise<T> {
  await allure.story(title);
  return Promise.resolve(allure.step(`Scenario: ${title}`, body));
}

/** Groups setup steps shared by every scenario in a feature, e.g. "the user is logged out". */
export function Background<T>(body: StepBody<T>): Promise<T> {
  return Promise.resolve(allure.step('Background', body));
}
