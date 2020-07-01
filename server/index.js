const WebSocket = require('ws')

const wss = new WebSocket.Server({port: 3000})

let num = 0

wss.on('connection', function connection(ws) {
  console.log('one client is connected');
  ws.on('message', function(msg) {
    const msgObj = JSON.parse(msg)
    if(msgObj.event === 'enter') {
      ws.name = msgObj.message
      num ++
    }
    // ws.send('serve:' + msg)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        msgObj.name = ws.name
        msgObj.num = num
        client.send(JSON.stringify(msgObj))
      }
    })
  })

  ws.on('close', function() {
    if(ws.name) {
      num --
    }
    let msgObj = {}
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        msgObj.name = ws.name
        msgObj.num = num
        msgObj.event = 'out'
        client.send(JSON.stringify(msgObj))
      }
    })
  })
})