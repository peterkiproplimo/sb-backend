const jwt = require("jsonwebtoken");
const SocketUser = require("../models/SocketUser");
const User = require("../models/User");

module.exports = async (socket, next) => {
  const authHeader = socket.handshake.auth.Authorization;
  if (!authHeader) {
    socket.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ")[1];
  if (!token || token === "") {
    socket.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    socket.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    socket.isAuth = false;
    return next();
  }
  // check if iser in db
  const player = await Player.findById(decodedToken.userId)
  
  if (!user) {
    socket.isAuth = false;
    return next();
  }
  await SocketUser.findOneAndUpdate(
    { user: player.id },
    { socketId: socket.id },
    {
      upsert: true, // Make this update into an upsert
    }
  );
  socket.isAuth = true;
  socket.user = decodedToken;
  return next();
};
