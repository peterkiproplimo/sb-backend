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
        "https://sbadmin.techsavanna.technology",
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

// Create a single instance of SocketManager
const socketManager = new SocketManager();

// Export the SocketManager instance

module.exports = { socketIO, socketCON, app, server, socketManager };
