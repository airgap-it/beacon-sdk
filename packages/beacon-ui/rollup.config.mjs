import { string } from 'rollup-plugin-string'
import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import postcssImport from 'postcss-import'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'MyApp',
      sourcemap: true
    },
    plugins: [
      resolve({ 
        extensions,
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        ignoreDynamicRequires: true
      }),
      postcss({
        inject: true,
        minimize: true,
        sourceMap: true
      }),
      typescript({
        tsconfig: 'tsconfig.json',
        tsconfigOverride: {
          include: ['src/**/*'],
          exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts']
        }
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }),
      terser(),
      json()
    ]
  },
  {
    input: 'src/index.ts',
    external: ['module', 'fs', 'path', 'crypto', 'worker_threads'],
    output: [
      {
        file: 'dist/cjs/index.js',
        format: 'cjs',
        sourcemap: true,
        globals: {
          module: 'module',
          fs: 'fs',
          path: 'path',
          crypto: 'crypto',
          worker_threads: 'worker_threads'
        }
      },
      {
        file: 'dist/esm/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({ 
        extensions,
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        ignoreDynamicRequires: true,
        transformMixedEsModules: true
      }),
      // Add the string plugin to import CSS files as raw text
      string({
        include: './ui/**/aggregated.css'
      }),
      postcss({
        plugins: [postcssImport()],
        inject: false,
        minimize: true,
        sourceMap: true
      }),
      typescript({
        tsconfig: 'tsconfig.json',
        tsconfigOverride: {
          include: ['src/**/*'],
          exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts']
        }
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }),
      terser(),
      json()
    ]
  }
]
