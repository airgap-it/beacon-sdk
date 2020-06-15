import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'

const pkg = require('./package.json')

const libraryName = 'beacon'

export default {
  input: `src/index.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  external: [],
  watch: {
    include: 'src/**'
  },
  plugins: [
    // Compile TypeScript files
    typescript({ tsconfig: './tsconfig.json', useTsconfigDeclarationDir: true }),

    // Resolve source maps to the original source
    sourceMaps()
  ]
}
