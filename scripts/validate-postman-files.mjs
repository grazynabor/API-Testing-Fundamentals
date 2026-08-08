import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const collectionPath = resolve('postman/ReqRes_API_Assignment.postman_collection.json');
const environmentPath = resolve('postman/ReqRes_API_Assignment.postman_environment.json');

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Invalid JSON file: ${path}`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const collection = readJson(collectionPath);
const environment = readJson(environmentPath);

if (collection?.info?.schema !== 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json') {
  console.error('The collection must use the Postman Collection v2.1 schema.');
  process.exit(1);
}

const assignment1 = collection?.item?.find(
  (item) => item?.name === 'Assignment 1 - Test Cases for a Real Endpoint',
);

if (!assignment1) {
  console.error('Assignment 1 folder was not found in the collection.');
  process.exit(1);
}

const environmentValues = Array.isArray(environment?.values) ? environment.values : [];
const requiredVariables = ['baseUrl', 'apiKey'];
const missingVariables = requiredVariables.filter(
  (key) => !environmentValues.some((variable) => variable?.key === key && variable?.enabled !== false),
);

if (missingVariables.length > 0) {
  console.error(`Missing enabled environment variables: ${missingVariables.join(', ')}`);
  process.exit(1);
}

const apiKey = environmentValues.find((variable) => variable?.key === 'apiKey');
if (apiKey?.value && apiKey.value !== 'PASTE_YOUR_REQRES_API_KEY_HERE') {
  console.error('The tracked Postman environment appears to contain a real API key. Replace it with the placeholder before committing.');
  process.exit(1);
}

console.log('Postman collection and environment validation passed.');
