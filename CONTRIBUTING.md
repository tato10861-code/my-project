# Contributing

1. Create a focused branch for each change.
2. Install with `pnpm install --frozen-lockfile`.
3. Run `pnpm check` in `src/src` before opening a pull request. It runs the smoke test, unit tests with coverage thresholds, lint, typecheck, dependency audit and production build, the same steps as CI.
4. Never commit `.env` files, credentials, customer data, or generated `.next` output.
5. Explain behavior changes and include the relevant validation steps in the pull request.
6. Write commit subjects in the [Conventional Commits](https://www.conventionalcommits.org/) form (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), and record user-visible changes in `CHANGELOG.md`.
7. Releases are tagged with semantic versions (`v1.0.0`).
