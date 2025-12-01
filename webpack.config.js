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
      // Existing fallbacks
      crypto: false,
      fs: false,
      stream: require.resolve('stream-browserify'),

      // Browser-compatible polyfills
      path: require.resolve('path-browserify'),
      util: require.resolve('util/'),
      process: require.resolve('process/browser'),

      // Node-only modules: treat as empty in browser builds
      module: false,
      worker_threads: false
    }
  },
  plugins: [
    // Handle node: protocol imports by replacing them with empty modules
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
