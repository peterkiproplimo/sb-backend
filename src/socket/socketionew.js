// socket.js
const { Server } = require("socket.io");
const express = require("express");

const app = express();
const server = require("http").createServer(app);

class SocketManager {
  constructor() {
    // Use the provided httpServer instance for Socket.IO
    // this.httpServer = require('http').createServer(app);
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "https://luckybox.evoton.co.ke"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket) => {
      console.log("A user connected");
    });

    this.middlewareFunctions = [];
  }

  use(middlewareFunction) {
    this.middlewareFunctions.push(middlewareFunction);
  }

  applyMiddleware() {
    this.middlewareFunctions.forEach((middlewareFunction) => {
      this.io.use(middlewareFunction);
    });
  }

  emitToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }
}

// Create a single instance of SocketManager
const socketManager = new SocketManager();

// Export the SocketManager instance
module.exports = { app, server, socketManager };
