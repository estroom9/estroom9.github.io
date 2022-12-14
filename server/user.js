let users = [];

exports.addUser = ({ id, name, userType, room, voted }) => {
  if (!name || !room) return { error: "name and room required." };
  const user = { id, name, userType, room, voted };

  users.push(user);

  return { user };
};

exports.updateUser = (user) => {
  let newUsers = users.filter((u) => u.id !== user.id);
  newUsers.push(user);
  users = newUsers;
  return user;
};

exports.removeUser = (id) => {
  const user = users.find((user) => user.id === id);
  if (user) {
    users = users.filter((user) => user.id !== id);
  }
  return user;
};

exports.getUser = (id) => {
  const user = users.find((user) => user.id === id);
  return user;
};

exports.getUsers = () => {
  return users;
};

exports.updateUsers = (list) => {
  users = list;
};
