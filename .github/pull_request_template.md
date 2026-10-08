## Summary

- What changed?
- Why was it needed?

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm audit --prod --audit-level high`
- [ ] `pnpm build`
- [ ] Browser smoke test completed when UI changed

## Security review

- [ ] No secrets or credentials added
- [ ] User input is validated server-side
- [ ] Auth and permissions were reviewed for changed routes
- [ ] No unrelated files or generated artifacts included
