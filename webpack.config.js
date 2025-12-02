const path = require('path')
const webpack = require('webpack')

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'beacon',
    libraryTarget: 'umd'
  },
  resolve: {
    fallback: {
      crypto: false,
      fs: false,
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      util: require.resolve('util/'),
      process: require.resolve('process/browser'),
      module: false,
      worker_threads: false
    }
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '')
      resource.request = mod
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js'
    })
  ]
}
