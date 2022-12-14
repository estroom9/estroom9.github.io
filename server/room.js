const { getUsers, updateUsers } = require("./user");

let rooms = [];

exports.addRoom = ({ id, name }) => {
  if (!name) return { error: "room name required." };

  const users = [];
  const room = { id, name, users };

  const index = rooms.findIndex((room) => room.id === id);
  if (index > -1) {
    return { error: "name and room required." };
  }
  rooms.push(room);

  return { room };
};

exports.removeRoom = (id) => {
  const room = rooms.find((room) => room.id === id);
  if (room) {
    rooms = rooms.filter((room) => room.id !== id);
  }
  return room;
};

exports.updateRoom = (room) => {
  let newRooms = rooms.filter((u) => u.id !== room.id);
  newRooms.push(room);
  rooms = newRooms;
  return room;
};

exports.getRoom = (roomName) => {
  const room = rooms.find((r) => r.name == roomName);
  return room;
};

exports.getRooms = () => {
  // update user in room
  const allUsers = getUsers();
  rooms?.forEach((room) => {
    const users = allUsers.filter((u) => u.room === room.name);
    room.users = users;
  });

  return rooms;
};

exports.removeRooms = () => {
  rooms = [];
  return rooms;
};

exports.addUserToRoom = (user, roomName) => {
  let room = this.getRoom(roomName);
  if (!room) return false;

  const userInfo = room.users.find((u) => u.id === user.id);
  if (!userInfo) {
    room.users.push(user);
    rooms = rooms.map((r) => {
      if (r.name === roomName) {
        return {
          ...r,
          users: room.users,
        };
      } else {
        return r;
      }
    });

    return true;
  }

  return false;
};
