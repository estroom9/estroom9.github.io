//index.js
const express = require('express');
const app = express();
const PORT = 8100;
const server = require('http').Server(app);

const cors = require('cors');
app.use(cors());

const socketIO = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

server.listen(PORT, () => console.log("Server running in port " + PORT));

// listen on server side
socketIO.on("connection", function(socket) {
  console.log(socket.id + ": connected");

  // on disconnect
  socket.on("disconnect", function() {
    console.log(socket.id + ": disconnected");
  });

  socket.on("message", data => {
    socketIO.sockets.emit("pong", data);
  });

});

app.get("/", (req, res) => {
  res.send("Game on!!!");
});
