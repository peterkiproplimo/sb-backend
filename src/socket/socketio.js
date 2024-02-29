const { Server } = require("socket.io");

const express = require("express");

const app = express();
const server = require("http").createServer(app);

const socketIO = (server) =>
  new Server(server, {
    cors: {
      origin: [
        "*",
        "https://safaribust.techsavanna.technology",
        "http://localhost:3001",
        "http://localhost:3000",
        "https://sbadmin.techsavanna.technology",
        "https://crash.safaribust.co.ke",
      ],
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

// Export the SocketManager instance

module.exports = { socketIO, socketCON };
