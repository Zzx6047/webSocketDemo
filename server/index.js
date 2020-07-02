const WebSocket = require('ws')
const http = require('http');
const jwt = require('jsonwebtoken')

const server = http.createServer();
const wss = new WebSocket.Server({
  noServer: true
})

const timeInterval = 1000

let group = {}

wss.on('connection', function connection(ws) {
  // 初试的心跳连接状态
  ws.isAlive = true
  console.log('one client is connected');
  ws.on('message', function (msg) {
    const msgObj = JSON.parse(msg)
    // console.log(msgObj)
    if (msgObj.event === 'enter') {
      ws.name = msgObj.message
      ws.roomid = msgObj.roomid
      if (typeof group[ws.roomid] === 'undefined') {
        group[ws.roomid] = 1
      } else {
        group[ws.roomid]++
      }
    }
    //鉴权
    if(msgObj.event === 'auth') {
      jwt.verify(msgObj.message, 'secret', (err, decode) => {
        if(err) {
          console.log('auth error');
          ws.send(JSON.stringify({
            event: 'noAuth',
            message: 'please auth again'
          }))
          return
        }else {
          console.log(decode);
          ws.isAuth = true
          return
        }
      })
      return
    }
    // 拦截非鉴权的请求
    if(!ws.isAuth) {
      return
    }
    // 心跳检测
    if(msgObj.event === 'heartbeat' && msgObj.message === 'pong') {
      ws.isAlive = true
      return
    }

    // 主动发送消息给客户端
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
  // console.log(request.headers)
  // This function is not defined on purpose. Implement it with your own logic.
  // authenticate(request, (err, client) => {
  //   if (err || !client) {
  //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //     socket.destroy();
  //     return;
  //   }
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  // });
});

server.listen(3000);

setInterval(() => {
  wss.clients.forEach((ws) => {
    if(!ws.isAlive) {
      group[ws.roomid] --
      return ws.terminate()
    }
    // 主动发送心跳检测请求
    // 当客户端返回了消息，主动设置flag在线
    ws.isAlive = false
    ws.send(JSON.stringify({
      event: 'heartbeat',
      message: 'ping',
      num: group[ws.roomid]
    }))
  })
}, timeInterval)