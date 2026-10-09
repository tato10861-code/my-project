import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      // Modules that open a database pool or need the auth secret at import.
      exclude: ['lib/db/**', 'lib/auth.ts', 'lib/auth-client.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
})
