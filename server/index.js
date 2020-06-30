const WebSocket = require('ws')

const wss = new WebSocket.Server({port: 3000})

wss.on('connection', function connection(ws) {
  console.log('one client is connected');
  ws.on('message', function(msg) {
    // ws.send('serve:' + msg)
    wss.clients.forEach((client) => {
      if (ws !== client && client.readyState === WebSocket.OPEN) {
        client.send('server:' + msg)
      }
    })
  })
})