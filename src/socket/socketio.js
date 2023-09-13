const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketIO = (server) =>
  new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      //   methods: ["GET", "POST"],
      credentials: true,
    },
  });

const socketCON = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡: ${socket.id} user connected`);
  });
  io.on;
};

module.exports = { socketIO, socketCON };
