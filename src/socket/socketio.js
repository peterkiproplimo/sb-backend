const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketIO = (server) =>
  new Server(server, {
    cors: {
       //origin: "https://safaribust.techsavanna.technology",
        origin: "http://localhost:3001",
      //   methods: ["GET", "POST"],
      credentials: false,
    },
  });

const socketCON = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡: ${socket.id} user connected`);
  });
  io.on;
};

module.exports = { socketIO, socketCON };
