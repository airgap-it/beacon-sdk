import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json' // Import the JSON plugin
import css from 'rollup-plugin-import-css'
// import terser from '@rollup/plugin-terser'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default {
  input: 'src/index.ts', // Update this to your entry file
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
    json(), 
    typescript({
      tsconfig: 'tsconfig.json'
    }),
    css(),
    babel({
      extensions,
      babelHelpers: 'bundled',
      presets: [
        '@babel/preset-typescript', // Add TypeScript preset
        'solid'
      ]
    }),
    // terser() // minify the output
  ],
  external: ['solid-js', 'solid-js/web'] // Specify dependencies to be excluded from the bundle
}
