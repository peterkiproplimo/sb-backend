const jwt = require("jsonwebtoken");
// const User = require("../models/Player");

module.exports = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  // console.log(`line ${authHeader}`)
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ")[1];
  if (!token || token === "") {
    req.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.isAuth = true;
  req.user = decodedToken;
  // console.log(req.isAuth);
  return next();
};
