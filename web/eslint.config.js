//  @ts-check

import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tanstackConfig } from '@tanstack/eslint-config'

const featuresDir = join(import.meta.dirname, 'src', 'features')
const featureNames = readdirSync(featuresDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

/**
 * Ranh giới import (xem .claude/rules/frontend/structure.md).
 * `no-restricted-imports` của khối sau thay thế hoàn toàn khối trước, nên mỗi khối phải tự gom đủ pattern.
 */
const serverOnlyPatterns = [
  {
    group: ['@/server/**'],
    message: '`@/server/**` chỉ dùng trong server function.',
  },
]

const restrictImports = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
})

const SERVER_CODE_FILES = [
  'src/server/**',
  'src/features/*/api/server-functions/**',
]

/**
 * Mỗi feature chỉ đọc feature khác qua barrel `api/index.ts`, nên cần một khối riêng cho từng feature.
 * Server function của feature được phép import `@/server/**`.
 */
const featureBoundaryConfigs = featureNames.flatMap((featureName) => {
  const featurePattern = {
    group: [
      '@/features/*/**',
      `!@/features/${featureName}/**`,
      '!@/features/*/api',
    ],
    message:
      'Feature chỉ được đọc feature khác qua barrel `@/features/<tên>/api`.',
  }
  return [
    {
      files: [`src/features/${featureName}/**/*.{ts,tsx}`],
      ignores: [`src/features/${featureName}/api/server-functions/**`],
      rules: restrictImports(featurePattern, ...serverOnlyPatterns),
    },
    {
      files: [`src/features/${featureName}/api/server-functions/**/*.ts`],
      rules: restrictImports(featurePattern),
    },
  ]
})

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: SERVER_CODE_FILES,
    rules: restrictImports(...serverOnlyPatterns),
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: restrictImports(
      {
        group: [
          '@/features/*/components/**',
          '@/features/*/api/server-functions/**',
        ],
        message:
          'Route chỉ ghép `pages/*` và factory từ barrel `api`; không import component hay server function.',
      },
      ...serverOnlyPatterns,
    ),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: restrictImports(
      {
        group: ['@/features/**'],
        message:
          '`lib` là hạ tầng dùng chung, không được biết nghiệp vụ của feature.',
      },
      ...serverOnlyPatterns,
    ),
  },
  ...featureBoundaryConfigs,
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/components/ui/**',
      'src/routeTree.gen.ts',
      '.output/**',
    ],
  },
]
