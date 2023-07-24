const webpack = require('webpack');

module.exports = function override(config, env) {
    const fallback = config.resolve.fallback || {};
    config.resolve.fallback = Object.assign(fallback, {
        "stream": require.resolve("stream-browserify")
    })

    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    )

    return config
}