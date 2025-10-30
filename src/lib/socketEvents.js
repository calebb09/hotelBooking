exports = module.exports = function (io) {
  //Set Listeners
  io.on("connection", (socket) => {
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
      users.push({
        userID: id,
        firebaseID: socket.handshake.query.firebaseId,
      });
    }
    // console.log("socket id " + socket.id);
    socket.join(socket.id);
    socket.emit("users", users);
    // console.log("a user has connected");
    // console.log(users);
    socket.on("online", (userId) => {
      users.forEach((user) => {
        if (user) {
          user.connected = true;
          console.log(user.connected);
        }
      });
    });

    socket.on(
      "private_message",
      ({ content, sender, receiver, role, picture }) => {
        var socketID = "";
        var sender_socket = "";
        users.forEach((element) => {
          if (element.firebaseID === receiver) {
            socketID = element.userID;
            // firebaseID = element.firebaseID
            // console.log("found user receivers socket = " + socketID);
          }
        });

        socket.to(socket.id).to(socketID).emit("private_message", {
          content,
          sender,
          receiver,
          role,
          picture,
        });
        // console.log("this is message has picture " + picture);
      }
    );

    socket.on("user typing", (data) => {
      io.sockets.to(data.receiver).emit("typing", data);
    });

    socket.on("disconnect", () => {
      // console.log("disconnecting user " + users);
      users.forEach((user) => {
        if (user) {
          user.connected = false;
          // console.log("user disconnected");
        }
      });
    });
  });
};
