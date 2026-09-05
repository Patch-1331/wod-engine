# Security Policy

WOD Engine is a personal project. It is pre-release and has no production
deployment, so there is no supported release line yet — security fixes land on
`main`.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting on this repository
(**Security** → **Report a vulnerability**), which opens a private advisory
visible only to the maintainer.

Expect an acknowledgement within a week. As a solo hobby project this comes
with no formal response-time or disclosure commitment.

## What we do

- **Dependabot alerts and security updates** are enabled; vulnerable
  dependencies open automated pull requests.
- **GitHub Actions** run with a read-only `GITHUB_TOKEN` and third-party
  actions are pinned to full commit SHAs.
- **Secrets** are never committed. `.env` files are gitignored;
  `apps/api/.env.example` documents the required variables with dummy values.
- **gitleaks** scans the full git history on every push and pull request, and
  runs as a pre-commit hook locally (`npm run hooks:install`).
- **CodeQL** static analysis and **dependency review** run on pull requests.

## Running the checks yourself

```sh
npm run hooks:install   # one time: enable the pre-commit secret scan
npm run security:scan   # gitleaks over the full history
npm run security:audit  # npm audit, production dependencies only
```

gitleaks is expected on `PATH` (`brew install gitleaks`). The pre-commit hook
skips with a warning if it is missing rather than failing the commit.
