const WebSocket = require('ws')
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({
  noServer: true
})

let group = {}

wss.on('connection', function connection(ws) {
  console.log('one client is connected');
  ws.on('message', function (msg) {
    const msgObj = JSON.parse(msg)
    console.log(msgObj)
    if (msgObj.event === 'enter') {
      ws.name = msgObj.message
      ws.roomid = msgObj.roomid
      if (typeof group[ws.roomid] === 'undefined') {
        group[ws.roomid] = 1
      } else {
        group[ws.roomid]++
      }
    }
    // ws.send('serve:' + msg)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        msgObj.name = ws.name
        msgObj.num = group[ws.roomid]
        client.send(JSON.stringify(msgObj))
      }
    })
  })

  ws.on('close', function () {
    if (ws.name) {
      group[ws.roomid]--

      let msgObj = {}
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.roomid === ws.roomid) {
          msgObj.name = ws.name
          msgObj.num = group[ws.roomid]
          msgObj.event = 'out'
          client.send(JSON.stringify(msgObj))
        }
      })
    }

  })
})

server.on('upgrade', function upgrade(request, socket, head) {
  // This function is not defined on purpose. Implement it with your own logic.
  // authenticate(request, (err, client) => {
  //   if (err || !client) {
  //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //     socket.destroy();
  //     return;
  //   }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, client);
    });
  // });
});


server.listen(8080);