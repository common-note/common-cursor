import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';

const packagesDir = path.resolve(__dirname, '../../packages');

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'My Site',
  icon: '/rspress-icon.png',
  base: '/',
  outDir: 'dist', // 改用其他目录名称
  route: {
    exclude: ['custom.tsx', 'components/**/*'],
  },
  plugins: [pluginSourceBuild()],
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
  builderConfig: {
    source: {
      alias: {
        'common-cursor': path.resolve(packagesDir, 'common-cursor/src'),
      },
    },
  },
});
