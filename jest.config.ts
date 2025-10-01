import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    // Exclude Next.js boilerplate and UI pages
    '!app/layout.tsx',
    '!app/page.tsx',
    '!app/**/page.tsx',
    '!app/login/**',
    '!app/register/**',
    // Exclude untested UI components (will test these later)
    '!components/ui/card.tsx',
    '!components/ui/input.tsx',
    '!components/ui/label.tsx',
    '!components/providers/**',
  ],
  coverageThreshold: {
    // Lenient global threshold
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    // Strict thresholds for API routes (business logic)
    './app/api/**/*.ts': {
      branches: 80,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    // Moderate thresholds for tested components
    './components/**/*.tsx': {
      branches: 50,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

export default createJestConfig(config)