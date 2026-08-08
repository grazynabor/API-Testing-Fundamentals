import { existsSync, readFileSync, appendFileSync } from 'node:fs';

const reportPath = 'reports/newman-results.json';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!existsSync(reportPath)) {
  const message = '## API test results\n\nNo Newman JSON report was generated. Check the test step logs.';
  if (summaryPath) appendFileSync(summaryPath, `${message}\n`);
  else console.log(message);
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const stats = report.run?.stats ?? {};
const failures = report.run?.failures ?? [];

const requestsTotal = stats.requests?.total ?? 0;
const requestsFailed = stats.requests?.failed ?? 0;
const assertionsTotal = stats.assertions?.total ?? 0;
const assertionsFailed = stats.assertions?.failed ?? 0;
const assertionsPassed = Math.max(assertionsTotal - assertionsFailed, 0);
const status = assertionsFailed === 0 && requestsFailed === 0 ? 'PASS' : 'FAIL';

let markdown = `## API test results — ${status}\n\n`;
markdown += '| Metric | Result |\n|---|---:|\n';
markdown += `| Requests | ${requestsTotal} |\n`;
markdown += `| Failed requests | ${requestsFailed} |\n`;
markdown += `| Assertions | ${assertionsTotal} |\n`;
markdown += `| Passed assertions | ${assertionsPassed} |\n`;
markdown += `| Failed assertions | ${assertionsFailed} |\n`;

if (failures.length > 0) {
  markdown += '\n### Failures\n';
  for (const failure of failures.slice(0, 10)) {
    const source = failure.source?.name ?? failure.source?.id ?? 'Unknown test';
    const error = failure.error?.message ?? 'Unknown error';
    markdown += `- **${source}** — ${error}\n`;
  }
}

markdown += '\nDetailed HTML, JUnit XML and JSON reports are available in the `newman-test-reports` workflow artifact.\n';

if (summaryPath) appendFileSync(summaryPath, markdown);
else console.log(markdown);
