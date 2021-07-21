var StaticServer = require('static-server')
var server1 = new StaticServer({
  rootPath: './examples/', // required, the root of the server file tree
  port: 8080, // required, the port to listen
  name: 'beacon' // optional, will set "X-Powered-by" HTTP header
})
var server2 = new StaticServer({
  rootPath: './examples/', // required, the root of the server file tree
  port: 8081, // required, the port to listen
  name: 'beacon' // optional, will set "X-Powered-by" HTTP header
})
server1.start(function () {
  console.log('Server1 listening to', server1.port)
  server2.start(function () {
    console.log('Server2 listening to', server2.port)
  })
})
