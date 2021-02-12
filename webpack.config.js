const TerserPlugin = require('terser-webpack-plugin')
const pkg = require('./package.json')
var SriPlugin = require('webpack-subresource-integrity')
var WebpackAssetsManifest = require('webpack-assets-manifest')

module.exports = {
  mode: 'production',
  entry: './dist/cjs/index.js',
  output: {
    library: 'beacon',
    libraryTarget: 'umd',
    path: __dirname,
    filename: pkg.unpkg,
    crossOriginLoading: 'anonymous'
  },
  // optimization: {
  //   minimize: true,
  //   minimizer: [new TerserPlugin()]
  // },
  plugins: [
    new SriPlugin({
      hashFuncNames: ['sha384'],
      enabled: true
    }),
    new WebpackAssetsManifest({ integrity: true })
  ]
}
