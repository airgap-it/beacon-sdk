import postcss from 'rollup-plugin-postcss'
import dts from 'rollup-plugin-dts'
import typescript from 'rollup-plugin-typescript2'
import withSolid from 'rollup-preset-solid'

export default withSolid([
  {
    input: 'src/index.ts',
    output: '.',
    plugins: [postcss()]
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/cjs/index.js',
        format: 'cjs'
      },
      {
        file: 'dist/esm/index.js',
        format: 'esm'
      }
    ],
    plugins: [
      postcss(),
      typescript()
      // typescript({
      //   tsconfig: 'tsconfig.json',
      //   include: ['src/**/*.ts'],
      //   useTsconfigDeclarationDir: true,
      //   output: ""
      // })
    ]
  }
])
