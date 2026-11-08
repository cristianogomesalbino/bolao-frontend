// @ts-check
/**
 * Lint Sonar local — só `src` (+ worker). Ignora `.next` (gera milhares de falsos positivos).
 * Uso: `npm run lint:sonar` ou passar path: `npm run lint:sonar -- src/components/destaques`
 */
import { createRequire } from 'node:module';

const require = createRequire(
  new URL('../bolao-backend/package.json', import.meta.url),
);
const sonarjs = require('eslint-plugin-sonarjs');
const tseslint = require('typescript-eslint');

const recomendadas = sonarjs.configs.recommended.rules ?? {};

/** Stub: arquivos do Next têm `eslint-disable react-hooks/...` sem o plugin neste config. */
const reactHooksStub = {
  rules: {
    'exhaustive-deps': {
      meta: { schema: [] },
      create() {
        return {};
      },
    },
  },
};

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      'out/**',
      'eslint.sonar.mjs',
      'next.config.*',
      'postcss.config.*',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'worker/**/*.ts'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      sonarjs,
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooksStub,
    },
    rules: {
      ...recomendadas,
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/nested-control-flow': ['error', { maximumNestingLevel: 3 }],
      'react-hooks/exhaustive-deps': 'off',
    },
  },
);
