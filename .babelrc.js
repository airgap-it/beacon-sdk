const sharedPresets = ['@babel/typescript']
const shared = {
  ignore: ['src/**/*.spec.ts'],
  presets: sharedPresets
}

module.exports = {
  env: {
    esmUnbundled: shared,
    esmBundled: {
      ...shared,
      presets: [
        [
          '@babel/env',
          {
            targets: '> 0.25%, not dead'
          }
        ],
        ...sharedPresets
      ],
      plugins: ['@babel/proposal-class-properties']
    },
    cjs: {
      ...shared,
      presets: [
        [
          '@babel/env',
          {
            modules: 'commonjs'
          }
        ],
        ...sharedPresets
      ],
      plugins: ['@babel/proposal-class-properties', '@babel/plugin-transform-runtime']
    },
    test: {
      presets: ['@babel/env', ...sharedPresets]
    }
  }
}
