import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: true,
    },
    {
      format: 'cjs',
      syntax: 'es2021',
    },
  ],
  source: {
    exclude: ['./experiment'],
    entry: {
      index: './src/index.ts',
      interface: './src/interface.ts',
      tokenizer: './src/tokenizer.ts',
      query: './src/query.ts',
      helper: './src/helper.ts',
      i18n: './src/i18n.ts',
      editor: './src/editor.ts',
      errors: './src/errors.ts',
    },
  },
});
