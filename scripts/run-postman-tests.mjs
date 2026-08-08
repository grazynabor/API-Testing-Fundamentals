import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const apiKey = process.env.REQRES_API_KEY?.trim();

if (!apiKey) {
  console.error('REQRES_API_KEY is not set. Add it to your shell or GitHub repository secrets.');
  process.exit(2);
}

mkdirSync('reports', { recursive: true });

const newmanCommand = process.platform === 'win32'
  ? join('node_modules', '.bin', 'newman.cmd')
  : join('node_modules', '.bin', 'newman');

const args = [
  'run',
  'postman/ReqRes_API_Assignment.postman_collection.json',
  '--environment',
  'postman/ReqRes_API_Assignment.postman_environment.json',
  '--env-var',
  `apiKey=${apiKey}`,
  '--folder',
  'Assignment 1 - Test Cases for a Real Endpoint',
  '--reporters',
  'cli,junit,json,html',
  '--reporter-junit-export',
  'reports/newman-results.xml',
  '--reporter-json-export',
  'reports/newman-results.json',
  '--reporter-html-export',
  'reports/newman-report.html',
  '--bail',
  'failure',
  '--timeout-request',
  '15000',
  '--timeout-script',
  '5000',
  '--color',
  'off',
];

const result = spawnSync(newmanCommand, args, {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('Unable to start Newman. Run npm install first.');
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
