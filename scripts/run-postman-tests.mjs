import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const apiKey = process.env.REQRES_API_KEY?.trim();

if (!apiKey) {
  console.error('REQRES_API_KEY is not set. Add it to your shell or GitHub repository secrets.');
  process.exit(2);
}

mkdirSync('reports', { recursive: true });

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  '--yes',
  'newman@6.2.2',
  'run',
  'postman/ReqRes_API_Assignment.postman_collection.json',
  '--environment',
  'postman/ReqRes_API_Assignment.postman_environment.json',
  '--env-var',
  `apiKey=${apiKey}`,
  '--folder',
  'Assignment 1 - Test Cases for a Real Endpoint',
  '--reporters',
  'cli,junit',
  '--reporter-junit-export',
  'reports/newman-results.xml',
  '--bail',
  'failure',
  '--timeout-request',
  '15000',
  '--timeout-script',
  '5000',
  '--color',
  'off',
];

const result = spawnSync(npxCommand, args, {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('Unable to start Newman.');
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
