import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2'
import withSolid from 'rollup-preset-solid'

export default withSolid([
  {
    input: 'src/index.tsx',
    output: [
      {
        file: 'dist/cjs/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/esm/index.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      postcss(),
      typescript({
        tsconfig: 'tsconfig.json',
        include: ['src/**/*.ts'],
        useTsconfigDeclarationDir: true
      })
    ]
  }
])
