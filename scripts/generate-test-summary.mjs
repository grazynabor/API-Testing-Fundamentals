import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const reportPath = 'reports/newman-results.json';
const htmlPath = 'reports/newman-report.html';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const writeSummary = (content) => {
  if (summaryPath) appendFileSync(summaryPath, `${content}\n`);
  else console.log(content);
};

if (!existsSync(reportPath)) {
  writeSummary('## API test results\n\nNo Newman JSON report was generated. Check the previous workflow step logs.');
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const stats = report.run?.stats ?? {};
const failures = report.run?.failures ?? [];
const executions = report.run?.executions ?? [];

const requestsTotal = stats.requests?.total ?? executions.length;
const requestsFailed = stats.requests?.failed ?? 0;
const assertionsTotal = stats.assertions?.total ?? 0;
const assertionsFailed = stats.assertions?.failed ?? failures.length;
const assertionsPassed = Math.max(assertionsTotal - assertionsFailed, 0);
const status = assertionsFailed === 0 && requestsFailed === 0 ? 'PASS' : 'FAIL';

let markdown = `## API test results - ${status}\n\n`;
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
    markdown += `- **${source}** - ${error}\n`;
  }
}

markdown += '\nDetailed HTML, JUnit XML and JSON reports are available in the `newman-test-reports` workflow artifact.\n';
writeSummary(markdown);

const executionRows = executions.map((execution) => {
  const name = execution.item?.name ?? 'Unnamed request';
  const method = execution.request?.method ?? '';
  const url = execution.request?.url?.raw ?? execution.request?.url?.toString?.() ?? '';
  const code = execution.response?.code ?? '-';
  const responseTime = execution.response?.responseTime ?? '-';
  const assertions = execution.assertions ?? [];
  const failedAssertions = assertions.filter((assertion) => assertion.error && !assertion.skipped);
  const result = failedAssertions.length === 0 ? 'PASS' : 'FAIL';
  const assertionDetails = assertions.length === 0
    ? '<span class="muted">No assertions</span>'
    : `<ul>${assertions.map((assertion) => {
        const assertionResult = assertion.skipped ? 'SKIP' : assertion.error ? 'FAIL' : 'PASS';
        const error = assertion.error?.message ? ` - ${escapeHtml(assertion.error.message)}` : '';
        return `<li><strong>${assertionResult}</strong> ${escapeHtml(assertion.assertion ?? 'Assertion')}${error}</li>`;
      }).join('')}</ul>`;

  return `
    <tr>
      <td><strong>${escapeHtml(name)}</strong><br><span class="muted">${escapeHtml(method)} ${escapeHtml(url)}</span></td>
      <td>${escapeHtml(code)}</td>
      <td>${escapeHtml(responseTime)} ms</td>
      <td><span class="status ${result.toLowerCase()}">${result}</span></td>
      <td>${assertionDetails}</td>
    </tr>`;
}).join('');

const failureSection = failures.length === 0
  ? '<p class="success-text">No failures recorded.</p>'
  : `<ul>${failures.map((failure) => {
      const source = failure.source?.name ?? failure.source?.id ?? 'Unknown test';
      const error = failure.error?.message ?? 'Unknown error';
      return `<li><strong>${escapeHtml(source)}</strong>: ${escapeHtml(error)}</li>`;
    }).join('')}</ul>`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ReqRes API Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f6f8fa; color: #1f2328; }
    main { max-width: 1180px; margin: 32px auto; padding: 0 20px 40px; }
    h1, h2 { margin-bottom: 12px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0 28px; }
    .card { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 16px; }
    .card .value { font-size: 28px; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d0d7de; }
    th, td { padding: 12px; border-bottom: 1px solid #d8dee4; vertical-align: top; text-align: left; }
    th { background: #f6f8fa; }
    ul { margin: 6px 0; padding-left: 20px; }
    .status { font-weight: 700; }
    .pass, .success-text { color: #1a7f37; }
    .fail { color: #cf222e; }
    .muted { color: #656d76; font-size: 12px; word-break: break-all; }
    .overall { font-size: 18px; font-weight: 700; }
  </style>
</head>
<body>
<main>
  <h1>ReqRes API Test Report</h1>
  <p class="overall ${status.toLowerCase()}">Overall result: ${status}</p>

  <section class="summary">
    <div class="card"><div>Requests</div><div class="value">${requestsTotal}</div></div>
    <div class="card"><div>Failed requests</div><div class="value">${requestsFailed}</div></div>
    <div class="card"><div>Assertions</div><div class="value">${assertionsTotal}</div></div>
    <div class="card"><div>Passed assertions</div><div class="value">${assertionsPassed}</div></div>
    <div class="card"><div>Failed assertions</div><div class="value">${assertionsFailed}</div></div>
  </section>

  <h2>Request details</h2>
  <table>
    <thead><tr><th>Request</th><th>Status code</th><th>Response time</th><th>Result</th><th>Assertions</th></tr></thead>
    <tbody>${executionRows || '<tr><td colspan="5">No request execution details available.</td></tr>'}</tbody>
  </table>

  <h2>Failures</h2>
  <div class="card">${failureSection}</div>
</main>
</body>
</html>`;

mkdirSync('reports', { recursive: true });
writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML report generated: ${htmlPath}`);
