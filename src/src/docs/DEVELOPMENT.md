# Development workflow

## Branches and pull requests

- `main` is the release branch.
- Feature work is developed on `v0/*` branches.
- Changes are reviewed through pull requests before merging.
- CI must pass before a change is considered release-ready.

## Required checks

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm audit --prod --audit-level high
pnpm build
```

## Release checklist

1. Confirm environment variables exist in the deployment environment.
2. Review the diff for secrets, debug output, and unrelated files.
3. Run all checks locally and wait for the GitHub Actions check.
4. Test the main user journey, lead submission, and error states.
5. Merge through a pull request and verify the deployment.

## Testing note

The current automated quality gate is CI-based linting, strict TypeScript checking, production dependency auditing, secret-pattern scanning, and a production build. External services such as email, payments, AI, and microphone access require a deployment smoke test because they depend on provider credentials and browser permissions.

## Project history and size

The repository history records the actual development workflow through feature branches, merges, CI hardening, security fixes, SEO/legal work, and documentation/testing work. Use these commands to inspect it without relying on an artificial timeline:

```bash
git log --oneline --decorate --all
git shortlog -sn --all
git ls-files | wc -l
```

For a reproducible source-size report, count tracked TypeScript, JavaScript, and configuration files only; do not include generated output, dependencies, or environment files. As of the documentation commit, the project contains 65 tracked files, 42 source/configuration files, and 1,328 source lines (101,118 source bytes). These figures should be regenerated after substantial changes.
