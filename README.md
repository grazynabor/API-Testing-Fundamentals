# ReqRes API QA Assignment

Automated API tests for the public [ReqRes](https://reqres.in) API, prepared as a Postman collection and executed in CI with Newman.

## Contents

- **Assignment 1:** five happy-path tests and four negative/non-2xx tests with automated assertions.
- **Assignment 2:** five exploratory contract-validation requests documented in the report and available in the Postman collection.
- **GitHub Actions:** Assignment 1 runs automatically for pull requests created from branches in this repository.
- **JUnit report:** each CI run uploads a `newman-results.xml` artifact.

## Repository structure

```text
.
├── .github/workflows/postman-api-tests.yml
├── docs/ReqRes_API_QA_Assignment_Report.pdf
├── postman/
│   ├── ReqRes_API_Assignment.postman_collection.json
│   └── ReqRes_API_Assignment.postman_environment.json
├── scripts/
│   ├── run-postman-tests.mjs
│   └── validate-postman-files.mjs
├── .gitignore
├── package.json
└── README.md
```

## Security: API key

The repository contains only the placeholder `PASTE_YOUR_REQRES_API_KEY_HERE`. Do not commit a real ReqRes API key.

For GitHub Actions, add the key as a repository secret:

1. Open the repository on GitHub.
2. Go to **Settings > Secrets and variables > Actions**.
3. Select **New repository secret**.
4. Use the name `REQRES_API_KEY`.
5. Paste the real ReqRes API key as the value and save it.

The workflow injects the secret at runtime with Newman's `--env-var` option. The key is not written back to the tracked Postman environment or uploaded as a test artifact.

## Run locally

Prerequisites:

- Node.js 22 or newer
- a ReqRes API key

### PowerShell

```powershell
$env:REQRES_API_KEY = "your-reqres-api-key"
npm test
```

### macOS or Linux

```bash
export REQRES_API_KEY="your-reqres-api-key"
npm test
```

The command validates the Postman JSON files and runs only the automated **Assignment 1** folder. Newman is downloaded at the pinned version `6.2.2` through `npx`.

## Pull request workflow

The workflow is triggered by:

- every pull request;
- a manual run from the **Actions** tab using `workflow_dispatch`.

The API job performs the following steps:

1. checks out the repository;
2. sets up Node.js 22;
3. validates the collection and environment JSON files;
4. verifies that `REQRES_API_KEY` is configured;
5. runs Assignment 1 with Newman;
6. uploads the JUnit XML report even when a test fails.

Assignment 2 remains exploratory rather than a merge-blocking test suite because its purpose is to observe and assess actual contract behaviour.

## Pull requests from forks

GitHub does not pass repository secrets to workflows started by pull requests from forks. For that reason, the API test job is intentionally limited to pull requests whose source branch belongs to this repository, plus manual workflow runs. Do not change the trigger to `pull_request_target` and execute untrusted pull-request code with repository secrets.

## Create the repository from the command line

After creating an empty GitHub repository, run these commands from this directory:

```bash
git init
git add .
git commit -m "Add ReqRes Postman tests and GitHub Actions"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Then configure the `REQRES_API_KEY` repository secret, create a new branch, push a change, and open a pull request to verify the workflow.
