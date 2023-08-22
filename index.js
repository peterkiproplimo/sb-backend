"use strict";
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { graphqlHTTP } = require("express-graphql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var schedule = require("node-schedule");
const moment = require("moment");
const otpGenerator = require("otp-generator");
var request = require("request");
const axios = require("axios");
const formatDate = require("./src/utils/formatDate");
var mysql = require('mysql');


//importing mongoose models

const Account = require("./src/models/account");
const Bet = require("./src/models/bet");
const Transaction = require("./src/models/transactions");
const Logs = require("./src/models/logs");
const BetHistory = require("./src/models/bethistory");
const Game = require("./src/models/gamedata");
const OTP = require("./src/models/verifier");
// const Admin = require("./src/models/admins");
const AdminLog=require("./src/models/adminlogs");
// Import the resolvers and the schema

const schema = require('./src/schema');
const resolvers = require('./src/resolvers');
//import the midleware to check for every incoming request if user is authenticated
const isAuth = require("./src/middleware/is-auth");
const house = require("./src/models/house");

const connectToDatabase = require('./config/database'); // Update the path if needed


const Actives = require("./src/models/activeusers");

const cors=require("cors"); 

const app = express(); 
const corsOptions ={ 
    origin:'*',   
    credentials:true,              //access-control-allow-credentials:true
    optionSuccessStatus:200,  
}  

app.use(cors(corsOptions)) 
app.use(express.json());
app.use(isAuth);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin","*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

let OTPs = [];

let betsLive = [];

app.get("/verify", async (req, res, next) => {
  
});

app.get("/remove", (req, res, next) => {
  betsLive = [];
  next();
});

//scheduler 0mim 0hour
schedule.scheduleJob("0 0 * * *", async function () {
  const houseAccount = await house.findOne({
    user: "62fb898a4a4d42002392750d",
  });
  (houseAccount.houseTotal = 0), console.log("dones");
  await houseAccount.save();
});




app.use(
  "/graphql",
  graphqlHTTP({
    schema:schema,
    rootValue:resolvers,
    graphiql: true,
  })
  );
    
const host = '0.0.0.0';


// Start the database connection and then start the server
connectToDatabase()

.then(() => {
  // Start the Express server
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
})
.catch(error => {
  console.error("Error connecting to the database:", error);
});


