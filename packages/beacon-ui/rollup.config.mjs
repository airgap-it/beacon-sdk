import postcss from 'rollup-plugin-postcss'
import css from 'rollup-plugin-import-css'
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import withSolid from 'rollup-preset-solid'

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
      resolve({ extensions }),
      commonjs(),
      postcss({
        extract: true,
        minimize: true,
        sourceMap: true
      }),
      css(),
      typescript({
        tsconfig: 'tsconfig.json'
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: ['solid', '@babel/preset-env']
      }),
      terser()
    ]
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/cjs/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/esm/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({ extensions }),
      commonjs(),
      postcss({
        extract: true,
        minimize: true,
        sourceMap: true
      }),
      css(),
      typescript({
        tsconfig: 'tsconfig.json'
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: ['solid', '@babel/preset-env']
      }),
      terser()
    ]
  }
]
