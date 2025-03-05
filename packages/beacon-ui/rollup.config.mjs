import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

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
        inject: true,
        minimize: true,
        sourceMap: true
      }),
      typescript({
        tsconfig: 'tsconfig.json'
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }),
      // terser()
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
        inject: true,
        minimize: true,
        sourceMap: true
      }),
      typescript({
        tsconfig: 'tsconfig.json'
      }),
      babel({
        extensions,
        babelHelpers: 'bundled',
        include: ['src/**/*'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }),
      // terser()
    ]
  }
]
