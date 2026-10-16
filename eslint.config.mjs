import nextConfig from 'eslint-config-next/core-web-vitals'
import typescriptConfig from 'eslint-config-next/typescript'

const config = [
  ...nextConfig,
  ...typescriptConfig,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      '.agents/**',
      '.claude/**',
      'agent/skills/**',
      'agents/**',
      'coverage/**',
    ],
  },
  { rules: { '@next/next/no-img-element': 'warn', 'import/no-anonymous-default-export': 'off' } },
]

export default config
