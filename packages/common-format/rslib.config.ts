import { defineConfig } from '@rslib/core';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';
import path from 'node:path';

// const packagesDir = path.resolve(__dirname, '..');

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
    // include: [
    //   {
    //     and: [packagesDir, { not: /[\\/]node_modules[\\/]/ }],
    //   },
    // ],
    exclude: ['./experiment'],
    entry: {
      index: './src/index.ts',
      formatter: './src/formatter.ts',
    },
  },
  resolve: {
    alias: {
      'common-cursor': path.resolve(__dirname, '../common-cursor/src'),
    },
  },
  plugins: [pluginSourceBuild()],
});
