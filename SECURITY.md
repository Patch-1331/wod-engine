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

## Known gaps

Secret scanning with push protection and CodeQL code scanning are not active,
because GitHub offers them free only on public repositories — on a private
repository they require GitHub Advanced Security.
