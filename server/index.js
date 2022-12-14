//index.js
const express = require("express");
const app = express();
const PORT = 8100;
const server = require("http").Server(app);
const cors = require("cors");
const {
  addUser,
  removeUser,
  getUser,
  getUsers,
  updateUser,
  updateUsers,
} = require("./user");
const {
  addRoom,
  getRooms,
  removeRoom,
  addUserToRoom,
  removeRooms,
  getRoom,
  updateRoom,
} = require("./room");
app.use(cors());

//const clientHost = "https://estroom9.github.io";
const clientHost = "http://localhost:3000";
const socketIO = require("socket.io")(server, {
  cors: {
    origin: clientHost,
  },
});
server.listen(PORT, () => console.log("Server running in port " + PORT));

const ClientListener = {
  MESSAGE: "message",
  ALL_ROOM: "allRoom",
};

const ServerListener = {
  MESSAGE: "message",
  MESSAGE_ALL: "messageAll",
  JOIN: "join",
  ADD_ROOM: "addRoom",
  ALL_ROOM: "allRoom",
  REMOVE_ALL_ROOM: "removeAllRoom",
  VOTE: "vote",
  GAME_EVENT: "GAME_EVENT",
};

// listen on server side
socketIO.on("connection", function (socket) {
  console.log(socket.id + ": connected");

  const allRoom = getRooms();
  socketIO.emit(ClientListener.ALL_ROOM, allRoom);

  // on disconnect
  socket.on("disconnect", function () {
    console.log(socket.id + ": disconnected");

    // remove user
    const user = removeUser(socket.id);
    if (!user) return;
    socketIO.to(user.room).emit(ClientListener.MESSAGE, {
      type: "notify",
      user: "",
      text: `${user.name} just left the room.`,
    });

    // Send to host
    const users = getUsers();
    const host = users?.find((u) => u.userType === "Host");
    if (host) {
      socketIO.to(host.id).emit(ClientListener.MESSAGE, {
        type: "users",
        message: users.filter((u) => u.room === user.room),
      });
    }
  });

  //actions
  socket.on(ServerListener.MESSAGE_ALL, (data) => {
    socketIO.sockets.emit(ClientListener.MESSAGE, data);
  });

  socket.on(ServerListener.JOIN, ({ name, userType, room }) => {
    const users = getUsers();
    const hostExisted = users?.find((u) => u.userType === "Host");
    if (hostExisted && userType === "Host") return;

    // Add user
    const { user, error } = addUser({
      id: socket.id,
      name,
      userType,
      room,
      voted: false,
    });

    if (error) {
      console.log(error);
      return;
    }

    const added = addUserToRoom(user, room);
    if (added === false) {
      return;
    }

    // Send to user
    socket.join(user.room);
    socketIO.to(socket.id).emit(ClientListener.MESSAGE, {
      type: "roomJoined",
      message: user,
    });

    // Send to host
    if (hostExisted) {
      socketIO.to(hostExisted.id).emit(ClientListener.MESSAGE, {
        type: "users",
        message: users,
      });
    }

    // Send to room
    socket.on(ServerListener.MESSAGE, ({ message }) => {
      const user = getUser(socket.id);
      socketIO.to(user.room).emit(ClientListener.MESSAGE, {
        user: user?.name,
        text: message,
      });
    });
  });

  socket.on(ServerListener.ADD_ROOM, ({ name }) => {
    const { room, error } = addRoom({ id: name, name });
    if (error) {
      const allRoom = getRooms();
      socketIO.emit(ClientListener.ALL_ROOM, allRoom);
      return;
    }

    socket.join(room.name);
    const allRoom = getRooms();
    socketIO.emit(ClientListener.ALL_ROOM, allRoom);
  });

  socket.on(ServerListener.ALL_ROOM, () => {
    const allRoom = getRooms();
    socketIO.to(socket.id).emit(ClientListener.ALL_ROOM, allRoom);
  });

  socket.on(ServerListener.REMOVE_ALL_ROOM, () => {
    const allRoom = removeRooms();
    socketIO.emit(ClientListener.ALL_ROOM, allRoom);
  });

  socket.on(ServerListener.VOTE, (data) => {
    let user = getUser(socket.id);
    user.voted = data;
    updateUser(user);

    // Send to host
    const users = getUsers();
    const host = users?.find(
      (u) => u.userType === "Host" && u.room === user.room
    );

    console.log("host ", host);
    console.log("users ", users);
    if (host) {
      socketIO.to(host.id).emit(ClientListener.MESSAGE, {
        type: "users",
        message: users,
      });
    }
  });

  socket.on(ServerListener.GAME_EVENT, (data) => {
    const { type } = data;
    switch (type) {
      case "NEW_GAME":
        const user = getUser(socket.id);
        if (!user) return;

        const allUsers = getUsers();
        let resetUsers = allUsers.filter((u) => u.room === user.room);
        resetUsers = resetUsers.map((u) => {
          return {
            ...u,
            voted: -1,
          };
        });
        updateUsers(resetUsers);
        let room = getRoom(user.room);
        if (!room) return;
        room.users = resetUsers.filter((u) => u.room === user.room);
        updateRoom(room);

        const host = resetUsers?.find(
          (u) => u.userType === "Host" && u.room === user.room
        );
        if (host) {
          socketIO.to(host.id).emit(ClientListener.MESSAGE, {
            type: "users",
            message: room.users,
          });
        }

        break;
      default:
        break;
    }
  });
});

//#region api
app.get("/", (req, res) => {
  res.send("Game on!!!");
});

app.get("/user/:id", (req, res) => {
  console.log("log , ", req.params);
  const { id } = req.params;
  const user = getUser(id);
  res.json(user);
});
//#endregion
