import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    'react',
    'react-dom',
    'ethers',
    'wagmi',
    'viem',
    '@tanstack/react-query',
    '@tanstack/react-query-devtools',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
