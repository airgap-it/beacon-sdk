module.exports = function (webpackEnv) {
  // ...
  return {
    // ...
    resolve: {
      // ...
      fallback: {
        // 👇️👇️👇️ add this 👇️👇️👇️
        stream: require.resolve('stream-browserify')
      }
    }
  }
}
