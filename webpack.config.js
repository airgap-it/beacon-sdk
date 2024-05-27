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
      crypto: require.resolve('crypto-browserify'),
      fs: false,
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      vm: require.resolve('vm-browserify')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
}
