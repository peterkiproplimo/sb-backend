const root= {
     
    calculateBalance:async(args, req)=>{
      const trans= await Transaction.find({type: "Deposit"}).sort({ createdAt: -1 });
      // console.log(trans[0])
  
      return {
        amount:trans[0].floatBalance
      }
      
    },
    
    transactionDetails:async(args, req)=>{
      const trans = await Transaction.findOne({trans_id:args.trans_id})
      const user = await User.findOne({phone:trans.bill_ref_number})
      const accnt = await Account.findOne({phone:trans.bill_ref_number})
  
      trans.balance = accnt.balance
      trans.username = user.username
      const tran = await trans.save()
      if(user.label === "1"){
        accnt.balance =`${parseFloat(+accnt.balance + +trans.amount).toFixed(2)}`
        user.label = "2"
        user.firstDeposit =+trans.amount
        await accnt.save();
        await user.save();
      }
       return {
          ...tran?._doc,
          _id: tran?.id,
          createdAt: new Date(trans?._doc?.createdAt).toISOString(),
          updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
        };
      
    },
    accountBalanceUpdate:async(args,req)=>{
      const account = await Account.findOne({user:args.userId});
      account.balance = args.amount;
      const doc=await account.save()
      return {
        ...doc._doc,
        _id: doc.id,
        user: singleUser.bind(this, doc._doc.user),
        createdAt: new Date(doc._doc.createdAt).toISOString(),
        updatedAt: new Date(doc._doc.updatedAt).toISOString(),
      };
    },
    aUser:async(args, req)=>{
      const user = await User.findOne({username:args.username})
      return  {
          ...user?._doc,
          _id: user?.id,
          createdAt: new Date(user?._doc?.createdAt).toISOString(),
          updatedAt: new Date(user?._doc?.updatedAt).toISOString(),
        };
    },
  
    userTransaction:async(args,req)=>{
      const trans = await Transaction.find({bill_ref_number:args.phone}).sort({ createdAt: -1 });
      return trans.map((trans) => {
        return {
          ...trans?._doc,
          _id: trans?.id,
          createdAt: new Date(trans?._doc?.createdAt).toISOString(),
          updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
        };
      });
    },
    allTransactions:async(args,req)=>{
      const trans = await Transaction.find().sort({ createdAt: -1 });
      return trans.map((trans) => {
        return {
          ...trans?._doc,
          _id: trans?.id,
          createdAt: new Date(trans?._doc?.createdAt).toISOString(),
          updatedAt: new Date(trans?._doc?.updatedAt).toISOString(),
        };
      });
    },
      userTT: async (args, req) => {
      const bets = await Bet.find({user:args.userId});
  
      let wonBets=bets.filter((item)=>item.win === true)
      let lostBets=bets.filter((item)=>item.win === false)
      let sum = bets.reduce((acc, obj) => {
        return acc + parseFloat(obj.tax);
      }, 0);
      return { tax: sum, won:wonBets.length, lost:lostBets.length };
    },
    totalDeposits: async (args, req) => {
      const bets = await Transaction.find({user:args.userId});
  
      let sum = bets.reduce((acc, obj) => {
        return acc + parseFloat(obj.amount);
      }, 0);
  
      // console.log(sum)
  
      return { amount: sum};
    },
      totalWidrawal: async (args, req) => {
      const bets = await Transaction.find({bill_ref_number:args.phone, type:"Withdrawal"});
  
      let sum = bets.reduce((acc, obj) => {
        return acc + parseFloat(obj.amount);
      }, 0);
  
      return { amount: sum};
    },
    deposit: async (args, req) => {
    
      try {
        const consumer_key = "e9U18oviHqQdAzrIP6jupLtjPTI16OmJ";
        const consumer_secret = "n53UGl05vCeLGz1H";
        const url =
          "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
        const auth = btoa(`${consumer_key}:${consumer_secret}`);
        const { data } = await axios.get(url, {
          headers: { Authorization: "Basic" + " " + auth },
        });
        if (data.access_token) {
          const timestamp = formatDate();
          const shortcode = 4097295;
          const passkey =
            "1bbf1ad26591bc48bca5faf176845a5feb3c929d96097ae77d3f45a84e2c339e";
          const password = Buffer.from(
            shortcode + passkey + timestamp
          ).toString("base64");
  
          let unirest = require("unirest");
          let req = unirest(
            "POST",
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
          )
            .headers({
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.access_token}`,
              Host: "api.safaricom.co.ke"
            })
            .send(
              JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: parseInt(args.amount),
                PartyA: parseInt(args.phone),
                PartyB: shortcode,
                PhoneNumber: parseInt(args.phone),
                CallBackURL:
                  "https://www.safaribust.co.ke/pesaxpress/STK/callback.php",
                AccountReference: parseInt(args.phone),
                TransactionDesc: "Deposit to SAFARIBUST Account",
              })
            )
            .end((res) => {
              if (res.error) throw new Error(res.error);
              var con = mysql.createConnection({
                host: "173.214.168.54",
                user: "bustadmin_dbadm",
                password: ";,bp~AcEX,*a",
                database:"bustadmin_paydb"
              });
                con.connect(function(err) {
                  if (err) throw err;
                    setInterval(()=>{
                      con.query(`SELECT * FROM transaction WHERE bill_ref_number='${args.phone}' ORDER BY trans_time DESC`, function (err, result) {
                      if (err) throw err;
                      let data=[]
                     
                      Object.keys(result).forEach(async function(key) {
                        var row = result[key];
                        const transaction= await Transaction.findOne({trans_id:row.trans_id})
                          data.push(row.trans_id)
                        if(!transaction){
                          const trans=new Transaction({
                          type:"Deposit",
                          trans_id:row.trans_id,
                          bill_ref_number:row.bill_ref_number,
                          trans_time:row.trans_time,
                          amount:row.trans_amount,
                          user:args.userId
                        })
                        await trans.save()
                        const account = await Account.findOne({ user: args.userId });
                        account.balance=parseFloat(account?.balance) + parseFloat(row.trans_amount)
                        await account.save()
                        // const ipAddress = req.socket.remoteAddress;
                        const log = new Logs({
                          ip: "deposits",
                          description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
                          user: args.userId,
                        });
                      await log.save();
                        con.end(()=>console.log("connection closed"))
                        }
                          con.end(()=>console.log("connection closed"))
                      });
                    },10000);
                    })
                });
              con.destroy()
            });         
        }
      } catch (err) {
        console.log(err);
      }
    },
    depositManual:(args, req)=>{
       var con = mysql.createConnection({
                host: "173.214.168.54",
                user: "bustadmin_dbadm",
                password: ";,bp~AcEX,*a",
                database:"bustadmin_paydb"
              });
                con.connect(function(err) {
                  if (err) throw err;
                    
                      con.query(`SELECT * FROM transaction WHERE bill_ref_number='${args.phone}' ORDER BY trans_time DESC`, function (err, result) {
                      if (err) throw err;
                      let data=[]
                     
                      Object.keys(result).forEach(async function(key) {
                        var row = result[key];
                        const transaction= await Transaction.findOne({trans_id:row.trans_id})
                          data.push(row.trans_id)
                        if(!transaction){
                          const trans=new Transaction({
                          type:"Deposit",
                          trans_id:row.trans_id,
                          bill_ref_number:row.bill_ref_number,
                          trans_time:row.trans_time,
                          amount:row.trans_amount,
                          user:args.userId
                        })
                        await trans.save()
                        const account = await Account.findOne({ user: args.userId });
                        account.balance=parseFloat(account?.balance) + parseFloat(row.trans_amount)
                        await account.save()
                        // const ipAddress = req.socket.remoteAddress;
                        const log = new Logs({
                          ip: "deposits",
                          description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
                          user: args.userId,
                        });
                        await log.save();
                        }
                
                   });
  
                                   con.destroy()
  
              })
          });
    },
    withdraw: async (args, req) => {
      const account = await Account.findOne({user:args.userId})
  
      if(parseFloat(args.amount) > parseFloat(account.balance)){
        throw new Error("Insufficient balance in your wallet")
      }
  
      const ipAddress = req.socket.remoteAddress;
      try {
        const consumer_key = "qhygNtCpa5tAMxAf3sjvvxXvHTtJkoAf";
        const consumer_secret = "gN9j1ZYPz4PBcOjr";
       const url =
          "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
        const auth = btoa(`${consumer_key}:${consumer_secret}`);
        const { data } = await axios.get(url, {
          headers: { Authorization: "Basic" + " " + auth },
        });
        if (data.access_token) {
          const timestamp = formatDate();
          const shortcode = 3034427;
          const passkey =
            "BCZcLvkd0lJU+AkbjLcbesMIdn4viqoI9B9jhiTMs2yJlxWAiLTeNm/ftOXz9rlgWdqHlMOW1JirTs/yGpH/yad/BECGKjCtrC0Wi0sj7e1vgoutLBgzXaUrNkSPQxE9aPAuw1Of4DROwy1eYtby+M0Ir/3qFDEWprkn/RRdsLGfaIv5leWGOa1SIbv0vdY13gBQAT1h2kiMWbyHZKgzcO90mZ5GerfUJk/ID4s/3DF+XkOe0Zmfg/1hX8va36SI67gY2OOlf60fYp5Ss2p1ISlE6qgudSd76Qxk3xTf9QhdoJmGPFt5Izq828h90+T139kINIkoOikMPcKYrvbCXA==";
          // const password = Buffer.from(
          //   shortcode + passkey + timestamp
          // ).toString("base64");
  
          let unirest = require("unirest");
          let req = unirest(
            "POST",
            "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
          )
            .headers({
              "Content-Type": "application/json",
              Authorization: "Bearer" + " " + data.access_token,
              Host:"api.safaricom.co.ke"
            })
            .send(
              JSON.stringify({
                InitiatorName: "KARIUKI",
                SecurityCredential:passkey,
                CommandID: "BusinessPayment",
                Amount: parseInt(args.amount),
                PartyA: shortcode,
                PartyB:  parseInt(args.phone),
                Remarks: `Withdrawal: ${args.username}-${args.phone}`,
                QueueTimeOutURL: "https://www.safaribust.co.ke/pesaxpress/B2C/timeout.php",
                ResultURL: "https://www.safaribust.co.ke/pesaxpress/B2C/result.php",
                Occassion: `Withdrawal: ${args.username}-${args.phone}`,
              })
            )
            .end(async(res) => {
              if (res.error) throw new Error(res.error);
                let filter = { user: args.userId };
                let update = {
                  balance: parseFloat(account?.balance) - parseFloat(args.amount),
                };
                await Account.findOneAndUpdate(filter, update);
                const log = new Logs({
                  ip: ipAddress,
                  description: `Withdrawn ${args.amount} - Account Name:${args.phone}`,
                  user: args.userId,
                });    
                await og.save()          
              });
            }
      } catch (err) {
        console.log(err);
      }
    },
    transactionStatus: async (args, req) => {
      try {
        const consumer_key = "FH9hAhMJLPK4bmgfwRA4X5rmDw6bAcFS";
        const consumer_secret = "Acug9RyTeMxgGWQt";
        const url =
          "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
        const auth = btoa(`${consumer_key}:${consumer_secret}`);
        const { data } = await axios.get(url, {
          headers: { Authorization: "Bearer" + " " + auth },
        });
        if (data.access_token) {
          const timestamp = formatDate();
          const shortcode = 600995;
          const passkey =
            "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
          const password = Buffer.from(
            shortcode + passkey + timestamp
          ).toString("base64");
  
          let unirest = require("unirest");
          let resp = unirest(
            "POST",
            "https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query"
          )
            .headers({
              "Content-Type": "application/json",
              Authorization: "Bearer 2q0gzUu4iGV4YQxNpJqaAmFklwVi",
            })
            .send(
              JSON.stringify({
                Initiator: "SAFARIBUST",
                SecurityCredential:
                  "BHNEI5SysGnVdVZ8R+SyHW5duGpAamLDawVPpZM7ZAEvSdhSWxXXw9Lj5kqCb40xc0I/NGHvMqqT4PH56qEl3aDKmOygD1Pf3o63JMrodf8bbcUHze4FcQQ1XmXrP6y14xX9Y06KHjuQkTY9LIvsYD6g+5in/S596nkhZ3UQp1ZijLDQWhKu5AH7abImpiolQg8SH5vo8as52FRgtHkIzzYfnxWNdq5BVzWA8/Iek5rnN3QG2OlWlfBKfxMbWjREIRyJp8fNWwa7daGqx5Zi01hHJ/tHQXzYKsCTiJ9Ew04kG7jZcYABmq7pL0PzPBU6pX78P4rJyGgEtWz/M6R1Dg==",
                CommandID: "TransactionStatusQuery",
                TransactionID: "OEI2AK4Q16",
                PartyA: 600995,
                IdentifierType: "4",
                ResultURL: "https://mydomain.com/TransactionStatus/result/",
                QueueTimeOutURL:
                  "https://mydomain.com/TransactionStatus/queue/",
                Remarks: "hda",
                Occassion: "hdad",
              })
            )
            .end((res) => {
              if (res.error) throw new Error(res.error);
            });
        }
      } catch (err) {
        console.log(err);
      }
    },
    verifyOtp: async (args, req) => {
      if (OTPs.includes(args.otp)) {
        // console.log("first")
        throw new Error("Invalid OTP!!!");
      }
      const otp = await OTP.findOne({ otp: args.otp }).sort({
        createdAt: -1,
      });
      // console.log(otp);
  
      if (
        !otp ||
        parseInt(new Date().toISOString().split("T")[1].substr(3, 2)) -
          parseInt(otp.createdAt.toISOString().split("T")[1].substr(3, 2)) >
          10
      ) {
                  // console.log("second")
  
        throw new Error("Invalid OTP!!!");
      }
      otp.verified = true;
  
      OTPs.push(args.otp);
  
      const verified = await otp.save();
  
      return {
        ...verified._doc,
        _id: verified.id,
        user: singleUser.bind(this, verified._doc.user),
        createdAt: new Date(verified._doc.createdAt).toISOString(),
        updatedAt: new Date(verified._doc.updatedAt).toISOString(),
      };
    },
    logout: async (args, req) => {
      const user = await User.findOne({ username: args.username });
      if(!user){
        throw Error("User not found")
      }
      user.online = false;
      await user.save();
  
       const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} logged out ${user.username}`,
        user: user._id,
      });
  
      await log.save();
      return user;
    },
    logoutUser: async (args, req) => {
      const user = await User.findOne({ username: args.username });
      if(!user){
        throw Error("User not found")
      }
      user.online = false;
      await user.save();
  
       const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: `${user.username} logged out `,
        user: user._id,
      });
      await log.save();
      return user;
    },
    // usersPerMonth: async () => {
    //   const users = await User.aggregate([
    //     {
    //       $group: {
    //         _id: { $substr: ["$createdAt", 5, 2] },
    //         numberofbets: { $sum: 1 },
    //       },
    //     },
    //   ]);
    //   // console.log(bets);
    //   return users;
    // },
    houseAmount: async () => {
      const amount = await Bet.aggregate([
        { $match: { win: false } },
        { $group: { _id: null, amount: { $sum: "$betAmount" } } },
      ]);
      return amount;
    },
    winnersBets: async () => {
      const bets = await Bet.find().sort({ createdAt: -1 });
      const currentBets = bets.filter((item) => item.round === bets[0].round);
  
      let sum = 0;
      currentBets.map((item) => {
        if (item.round !== bets[0].round) {
          return;
        }
        if (item.win === false) {
          sum = sum + item.betAmount;
        }
        if (item.win === true) {
          sum = sum - item.amount;
        }
      });
      // console.log(sum);
      return { round: bets[0].round, amount: sum };
    },
    winnersPerRound: async () => {
  
      const bets = await Bet.aggregate([
        { $match: { win: false } },
        { $group: {
           _id:{round: "$round", createdAt:{ $substr: ["$createdAt", 5, 2] } }, 
        amount: { $sum: "$betAmount" } } },
        { $sort: { amount: 1, _id: 1 } },
      ]);
       let bt=bets.filter(it=>+it._id.createdAt === new Date().getMonth()+1)
  
       let bts = []
  
       bt.map(it=>{
        let obj={
          _id:+it._id.round,
          amount:it.amount
        }
        bts.push(obj)
       })
  
  
      return bts;
    },
    losersPerRound: async () => {
  
      const bets = await Bet.aggregate([
        { $match: { win: true,  } },
        {
          $group: {
            _id:{round: "$round", createdAt:{ $substr: ["$createdAt", 5, 2] } },
            amount: { $sum: { $add: ["$amount", "$tax"] } },
          },
        },
        { $sort: { amount: 1, _id: 1 } },
      ]);
              let bt=bets.filter(it=>+it._id.createdAt === new Date().getMonth()+1)
      let bts = []
  
       bt.map(it=>{
        let obj={
          _id:+it._id.round,
          amount:it.amount
        }
        bts.push(obj)
       })
  
  
      return bts;
    },
    winnersPerMonth: async () => {
      const bets = await Bet.aggregate([
        { $match: { win: false } },
        {
          $group: {
            _id: { $substr: ["$createdAt", 5, 2] },
            amount: { $sum: "$betAmount" },
          },
        },
        { $sort: { amount: 1, _id: 1 } },
      ]);
      let bt=bets.filter(it=>+it._id === new Date().getMonth()+1)
      console.log(bt);
      return bt;
    },
    losersPerMonth: async () => {
      const bets = await Bet.aggregate([
        { $match: { win: true } },
        {
          $group: {
            _id: { $substr: ["$createdAt", 5, 2] },
            amount: { $sum: { $add: ["$amount", "$tax"] } },
          },
        },
        { $sort: { amount: 1, _id: 1 } },
      ]);
     let bt=bets.filter(it=>+it._id === new Date().getMonth()+1)
      return bt;
    },
    betsPerMonth: async () => {
      const bets = await Bet.aggregate([
        {
          $group: {
            _id: { $substr: ["$createdAt", 5, 2] },
            numberofbets: { $sum: 1 },
          },
        },
      ]);
      // console.log(bets);
      return bets;
    },
    usersPerMonth: async () => {
      const bets = await User.aggregate([
        { $match: { type: "User" } },
        {
          $group: {
            _id: { $substr: ["$createdAt", 5, 2] },
            amount: { $sum: 1 },
          },
        },
        { $sort: { amount: 1, _id: 1 } },
      ]);
      //console.log(bets);
      return bets;
    },
    activesPerMonth: async () => {
      const bets = await Actives.aggregate([
        { $unwind: "$username" },
        {
          $group: {
            _id: {
              username: "$username",
              createdAt: "$createdAt",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: { $substr: ["$_id.createdAt", 5, 2] },
            distinctV: {
              $addToSet: {
                value: "$_id.username",
                numberOfValues: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            distinctV: 1,
          },
        },
      ]);
  
      let dt = [];
      bets.map((item) => {
        let obj = {
          _id: item.month,
          amount: item.distinctV.length,
        };
        dt.push(obj);
      });
      return dt.sort((a, b) => a._id - b._id);
    },
  
    activeUser: async () => {
      const actives = await Actives.find().sort({ createdAt: -1 });
      let dt = [];
      if (actives) {
        actives.map((item) => {
          if (
            item.createdAt.toISOString().split("T")[0] ===
            moment(new Date()).format("YYYY-MM-DD")
          ) {
            let present = dt.filter((it) => item.username === it.username);
            if (present.length === 0) {
              dt.push(item);
            }
          }
        });
      }
      return dt.map((item) => {
        return {
          ...item?._doc,
          _id: item?.id,
          createdAt: new Date(item?._doc?.createdAt).toISOString(),
          updatedAt: new Date(item?._doc?.updatedAt).toISOString(),
        };
      });
    },
    actives: async (args, req) => {
   
      const users = await Actives.find().sort({ createdAt: -1 });
      // console.log(users);
      return users.map((user) => {
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      });
    },
    customerToTal: async () => {
      const accounts = await Account.find().sort({ createdAt: -1 });
    
      let sum = accounts.reduce((acc, obj) => {
        return acc + parseFloat(obj.balance);
      }, 0);
      return { amount: sum };
    },
    taxToTal: async () => {
      const bets = await Bet.find().sort({ createdAt: -1 });
  
      let bts=bets.filter((item)=>item.createdAt.getMonth()+1 === new Date().getMonth()+1)
  
      let sum = bts.reduce((acc, obj) => {
        return acc + parseFloat(obj.tax);
      }, 0);
  
      return { amount: sum };
    },
    players: async (args, req) => {
      const users = await User.find().sort({ createdAt: -1 });
  
      const usrs = users.filter((item) => item.type === "User");
  
      return usrs.map((user) => {
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      });
    },
    users: async (args, req) => {
      // if (!req.isAuth) {
      //   throw new Error("Not authenticated.");
      // }
      const users = await User.find().sort({ createdAt: -1 });
      const usrs = users.filter((item) => item.type === "User");
        return usrs.map((user) => {
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      });
    },
    admins: async (args, req) => {
      // if (!req.isAuth) {
      //   throw new Error("Not authenticated.");
      // }
      const users = await Admin.find().sort({ createdAt: -1 });
  
      // const usrs = users.filter((item) => item.type !== "User");
  
      return users.map((user) => {
        return {
          ...user._doc,
          _id: user.id,
          createdAt: new Date(user._doc.createdAt).toISOString(),
          updatedAt: new Date(user._doc.updatedAt).toISOString(),
        };
      });
    },
    getCurrentRound: async (args, req) => {
      const currentBets = await Bet.find({ round: args.round }).sort({
        createdAt: -1,
      });
      return currentBets.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
    getHouse: async (args, req) => {
      const bets=await Bet.find()
      const dayBets=bets.filter(item =>item.createdAt.toISOString().split("T")[0] === moment(new Date()).format("YYYY-MM-DD"))
  
      let lost=0
      let won =0
  
     if(dayBets.length>1){
       dayBets.map(item=>{
            if(item.win==false){
          won=won+item.betAmount
          return
        }
        if(item.win==true){
          lost=lost+item.amount+item.tax
          return
        }
     
      })
     }
  
  return      [
    {
      "houseTotal": won-lost,
      "_id": "6318a55d329e4eaf1f1bcd9a",
      "createdAt": new Date().toISOString()
    }
  ]
  
    },
    accounts: async (args, req) => {
  
     const acc= await Account.find().sort({ createdAt: -1 })
        return acc.map(async(acc) => {
                  // const user = await singleUser.bind(this, acc?._doc.user)
          const user = await User.findOne({_id:acc?._doc.user})
          return {  
            ...acc?._doc,
            _id: acc?.id,
            user: user,
            createdAt: new Date(acc?._doc?.createdAt).toISOString(),
            updatedAt: new Date(acc?._doc?.updatedAt).toISOString(),
          }
        });
    
  
     
    },
    historyBets: async (args, req) => {
  
      const bets = await Bet.find({ user: args.userId }).sort({
        createdAt: -1,
      }).limit(50);
  
      return bets.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
  
    bets: async (args, req) => {
    
      const bets = await Bet.find({ user: args.userId })
        .sort({
          createdAt: -1,
        })
        .limit(20);
      return bets.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
    allBets: async (args, req) => {
      const bets = await Bet.find().sort({ createdAt: -1 });
      console.log(bets)
      return bets.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc?.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
    filteredBets: async (args, req) => {
   
      const bets = await Bet.find({ win: true }).sort({ createdAt: -1 });
      return bets.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc?.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
    history: async (args, req) => {
    
      const history = await BetHistory.find({ user: args.userId })
        .sort({ createdAt: -1 })
        .limit(30);
  
      return history.map((bet) => {
        return {
          ...bet?._doc,
          _id: bet?.id,
          user: singleUser.bind(this, bet?._doc?.user),
          createdAt: new Date(bet?._doc?.createdAt).toISOString(),
          updatedAt: new Date(bet?._doc?.updatedAt).toISOString(),
        };
      });
    },
  
    transactions: async (args, req) => {
      if (!req.isAuth) {
        throw new Error("Not authenticated.");
      }
      const transactions = await Transaction.find({ user: args.userId });
      return transactions.map((item) => {
        return {
          ...item?._doc,
          _id: item?.id,
          user: singleUser.bind(this, item?._doc.user),
          createdAt: new Date(item?._doc?.createdAt).toISOString(),
          updatedAt: new Date(item?._doc?.updatedAt).toISOString(),
        };
      });
    },
    accountBalance: async (args, req) => {
      // if(!req.isAuth){
      //   throw new Error("Not authenticated.");
      // }
      const account = await Account.findOne({ user: args.userId });
      return {
        _id: account?.id,
        balance: account?.balance,
        user: singleUser.bind(this, account._doc.user),
        createdAt: new Date(account?._doc?.createdAt).toISOString(),
        updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
      };
    },
  
  
    systemLogs: async (args, req) => {
      const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(200);
      return logs.map((it) => {
        return {
          ...it._doc,
          _id: it.id,
          user: singleUser.bind(this, it._doc.user),
          createdAt: new Date(it._doc.createdAt).toISOString(),
          updatedAt: new Date(it._doc.updatedAt).toISOString(),
        };
      });
    },
    logs: async (args, req) => {
      const logs = await Logs.find().sort({ createdAt: -1 }).limit(200);
      return logs.map((log) => {
        return {
          ...log._doc,
          _id: log?.id,
          user: singleUser.bind(this, log._doc.user),
          createdAt: new Date(log?._doc?.createdAt).toISOString(),
          updatedAt: new Date(log?._doc?.updatedAt).toISOString(),
        };
      });
    },
    createBetHistory: async (args, req) => {
      const history = new BetHistory({
        point: args.point,
        user: args.user,
      });
      const data = await history.save().then((res) => res);
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: "Added bet a history",
        user: args.user,
      });
  
      await log.save();
      return {
        ...data?._doc,
        _id: data?.id,
        user: singleUser.bind(this, data?._doc.user),
        createdAt: new Date(data?._doc?.createdAt).toISOString(),
        updatedAt: new Date(data?._doc?.updatedAt).toISOString(),
      };
    },
    suspendPlayer: async (args, req) => {
      let filter = { username: args.username };
      let update = { active: false };
      const user = await Admin.findOneAndUpdate(filter, update);
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} suspended ${user.username}`,
        user: user.id,
      });
  
      await log.save();
      return {
        ...user._doc,
        _id: user.id,
        createdAt: new Date(user._doc.createdAt).toISOString(),
        updatedAt: new Date(user._doc.updatedAt).toISOString(),
      };
    },
    suspendAccount: async (args, req) => {
      let filter = { _id: args.accountId };
      let update = { active: false };
      const account = await Account.findOneAndUpdate(filter, update);
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} suspended ${account.id}`,
        user: account.user.id,
      });
  
      await log.save();
  
      return {
        ...account._doc,
        _id: account.id,
        user: singleUser.bind(this, account._doc.user),
        createdAt: new Date(account._doc.createdAt).toISOString(),
        updatedAt: new Date(account._doc.updatedAt).toISOString(),
      };
    },
    activateAccount: async (args, req) => {
      let filter = { _id: args.accountId };
      let update = { active: true };
      const account = await Account.findOneAndUpdate(filter, update);
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} activated ${account.id}`,
        user: account.user.id,
      });
  
      await log.save();
      return {
        ...account._doc,
        _id: account.id,
        user: singleUser.bind(this, account._doc.user),
        createdAt: new Date(account._doc.createdAt).toISOString(),
        updatedAt: new Date(account._doc.updatedAt).toISOString(),
      };
    },
    activatePlayer: async (args, req) => {
      let filter = { username: args.username };
      let update = { active: true };
      const user = await Admin.findOneAndUpdate(filter, update);
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} activated ${user.username}`,
        user: user.id,
      });
  
       await log.save();
      return {
        ...user._doc,
        _id: user.id,
        createdAt: new Date(user._doc.createdAt).toISOString(),
        updatedAt: new Date(user._doc.updatedAt).toISOString(),
      };
    },
    refundAccount: async (args, req) => {
      const account = await Account.findOne({ user: args.userId });
      if(!account && +args.amount < 0){
        return
      }
      let bal=account.balance 
      account.balance = args.amount;
      const doc = await account.save();
  
      //Refund account
      if (args.backend !== true) {
        const houseAccount = await house.findOne({
          user: "62fb898a4a4d42002392750d",
        });
        houseAccount.houseTotal =
          +houseAccount?.houseTotal - +args?.amount;
  
        await houseAccount.save();
      }
  
      //save logs
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: `Account refunded ${parseFloat( +args.amount - +bal ).toFixed(2)}- Account Name:${account.user.username}`,
        user: args.userId,
        balance:account.balance
      });
  
     await log.save();
      return {
        ...doc._doc,
        _id: doc.id,
        user: singleUser.bind(this, doc._doc.user),
        createdAt: new Date(doc._doc.createdAt).toISOString(),
        updatedAt: new Date(doc._doc.updatedAt).toISOString(),
      };
    },
    adminrefundAccount: async (args, req) => {
      const account = await Account.findOne({ user: args.userId });
      if(!account && parseFloat(args.amount) < 1){
        return
      }
      let filter = { user: args.userId };
      let update = {
        balance: `${+account?.balance + +args.amount}`,
      };
      const doc = await Account.findOneAndUpdate(filter, update);
  
      if (args.backend !== true) {
        const houseAccount = await house.findOne({
          user: "62fb898a4a4d42002392750d",
        });
        houseAccount.houseTotal =
          +houseAccount?.houseTotal - +args?.amount;
  
        await houseAccount.save();
      }
  
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} refunded ${args.amount}- Account Name:${account?.user?.username}`,
        user: args.userId,
      });
  
      await log.save();
      return {
        ...doc._doc,
        _id: doc.id,
        user: singleUser.bind(this, doc._doc.user),
        createdAt: new Date(doc._doc.createdAt).toISOString(),
        updatedAt: new Date(doc._doc.updatedAt).toISOString(),
      };
    },
    deductAccountBalance: async (args, req) => {
      const user = await User.findOne({_id:args.userId})
  
      if(user.dataToken !== args.dataToken){
        throw new Error("Session expired!!!")
      }
  
      const account = await Account.findOne({ user: args.userId });
      if(+account.balance <0){
        account.balance = "0";
        throw new Error("Insufficient funds")
      }
      let bal =account.balance
      account.balance=args.amount;
      const doc = await account.save();
  
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: `Deducted ${parseFloat(+args.amount-+bal).toFixed(2)} - Account Name:${account?.user.username}`,
        user: args.userId,
        balance:account.balance
      });
  
      await log.save();
      return {
        ...doc._doc,
        _id: doc.id,
        user: singleUser.bind(this, doc._doc.user),
        createdAt: new Date(doc._doc.createdAt).toISOString(),
        updatedAt: new Date(doc._doc.updatedAt).toISOString(),
      };
    },
    admindeductAccountBalance: async (args, req) => {
      const account = await Account.findOne({ user: args.userId });
      let filter = { user: args.userId };
      let update = {
        balance: `${+account?.balance - +args.amount}`,
      };
      const doc = await Account.findOneAndUpdate(filter, update);
  
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${args.initiator} deducted account ${args.amount} - Account Name:${account?.user?.username}`,
        user: args.userId,
      });
  
      await log.save();
      return {
        ...doc._doc,
        _id: doc.id,
        user: singleUser.bind(this, doc._doc.user),
        createdAt: new Date(doc._doc.createdAt).toISOString(),
        updatedAt: new Date(doc._doc.updatedAt).toISOString(),
      };
    },
    changePassword: async (args, req) => {
      const user = await User.findOne({ username: args.username });
      if (!user) {
        throw new Error("User does'nt exist.");
      }
      return bcrypt
        .hash(args.password, 12)
        .then((hashedPass) => {
          user.password = hashedPass;
          return user.save();
        })
        .then(async (usr) => {
          const ipAddress = req.socket.remoteAddress;
          const log = new Logs({
            ip: ipAddress,
            description: `${args.initiator} changed password`,
            user: usr.id,
          });
  
          await log.save();
          return { ...usr._doc, _id: usr.id, password: null };
        })
        .catch((err) => console.log(err.message));
    },
    changeAdminPassword: async (args, req) => {
      const user = await Admin.findOne({ username: args.username });
      if (!user) {
        throw new Error("User does'nt exist.");
      }
      return bcrypt
        .hash(args.password, 12)
        .then((hashedPass) => {
          user.password = hashedPass;
          return user.save();
        })
        .then(async(usr) => {
          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `${args.initiator} changed password for ${user.username}`,
            user: usr.id,
          });
  
          await log.save();
          return { ...usr._doc, _id: usr.id, password: null };
        })
        .catch((err) => console.log(err.message));
    },
    editAdminUserPhone: async (args, req) => {
       const user = await User.findOne({ username: args.username });
      if (!user) {
        throw new Error("User does'nt exist.");
      }
      user.phone = args.phone;
      return user
        .save()
        .then(async(usr) => {
          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `${args.initiator} changed user phone to ${user.phone}`,
            user: usr.id,
          });
  
          await log.save();
          return { ...user._doc, _id: user.id, password: null };
        })
        .catch((err) => console.log(err.message));
    },
    editAdminUser: async (args, req) => {
      const user = await Admin.findOne({ username: args.username });
      if (!user) {
        throw new Error("User does'nt exist.");
      }
      user.type = args.type;
      user.phone = args.phone
      return user
        .save()
        .then(async(usr) => {
          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `${args.initiator} edited user ${args.username}`,
            user: usr.id,
          });
  
          await log.save();
          return { ...user._doc, _id: user.id, password: null };
        })
        .catch((err) => console.log(err.message));
    },
    changeType: async (args, req) => {
      const user = await Admin.findOne({ username: args.username });
      if (!user) {
        throw new Error("User does'nt exist.");
      }
      user.type = args.type;
      return user
        .save()
        .then(async (usr) => {
          const ipAddress = req.socket.remoteAddress;
          const log = new AdminLog({
            ip: ipAddress,
            description: `${args.initiator} changed user type for ${user.type}`,
            user: usr.id,
          });
  
          await log.save();
          return { ...user._doc, _id: user.id, password: null };
        })
        .catch((err) => console.log(err.message));
    },
    createUser: (args, req) => {
      
      return User.findOne({ username: args.userInput.username })
        .then((user) => {
          if (user) {
            throw new Error("Username already exists!!!");
          }
          return bcrypt.hash(args.userInput.password, 12);
        })
        .then((hashedPass) => {
          const otp = otpGenerator.generate(12, {
                upperCaseAlphabets: true,
                lowerCaseAlphabets: false,
                digits: true,
                specialChars: false,
              });
              
          const user = new User({
            type: args.userInput.type,
            username: args.userInput.username,
            active: true,
            phone: args.userInput.phone,
            online: false,
            password: hashedPass,
            dataToken:otp,
            label:"1",
            firstDeposit:0
          });
          return user.save();
        })
        .then(async (result) => {
          if (result) {
            const account = new Account({
              balance: "0.00",
              phone:args.userInput.phone,
              active:true,
              user: result.id,
            });
            await account.save();
            //TODO: send a verification email
            const ipAddress = req.socket.remoteAddress;
            const log = new AdminLog({
              ip: ipAddress,
              description: `Created a new user ${args.userInput.username}`,
              user: result.id,
            });
  
            await log.save();
            console.log(log);
          }
          const token = await jwt.sign(
            {
              userId: result.id,
              username: result.username,
              online: result.online,
              phone: result.phone,
            },
            "thisissupposedtobemysecret",
            {
              expiresIn: 60 * 15,
            }
          );
          return {
            userId: result.id,
            username: result.username,
            type: result.type,
            token: token,
            tokenExpiration: 15,
          };
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
    },
    createAdmin: (args, req) => {
      return Admin.findOne({ username: args.userInput.username }) 
        .then((user) => {
          if (user) {
            throw new Error("Username already exists!!!");
          }
          return bcrypt.hash(args.userInput.password, 12);
        })
        .then((hashedPass) => {
          const user = new Admin({
            type: args.userInput.type,
            username: args.userInput.username,
            active: true,
            phone: args.userInput.phone,
            online: true,
            password: hashedPass,
          }); 
          return user.save();
        })
        .then(async (result) => {
          if (result) {
            // const account = new Account({
            //   balance: "0.00",
            //   user: result.id,
            // });
            // await account.save();
            //TODO: send a verification email
            const ipAddress = req.socket.remoteAddress;
            const log = new AdminLog({
              ip: ipAddress,
              description: `${args.userInput.initiator} created admin ${args.userInput.username}`,
              user: result.id,
            });
  
            await log.save();
          }
          const token = await jwt.sign(
            {
              userId: result.id,
              username: request.username,
              online: result.online,
              phone: result.phone,
            },
            "thisissupposedtobemysecret",
            {
              expiresIn: 60 * 15,
            }
          );
          // console.log({ userId: user.id, type:user.type, token: token, tokenExpiration: 1 })
          return {
            userId: result.id,
            type: result.type,
            token: token,
            tokenExpiration: 15,
          };
          // return { ...result._doc, _id: result.id, password: null };
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
    },
    createActives: async (args, req) => {
      const user = await User.findOne({ username: args.user });
      const activeUser = new Actives({
        username: user.username,
        type: user.username,
        phone: user.phone,
        online: user.online,
        active: user.active,
      });
      const active = await activeUser.save();
      const ipAddress = req.socket.remoteAddress;
      const accnt = await Account.findOne({ user: user.id });
      const log = new Logs({
        ip: ipAddress,
        description: `User placed a bet for round ${args.round}`,
        user: user.id,
        round: args.round,
        balance:+accnt.balance
      });
  
      await log.save();
      return {
        ...active._doc,
        _id: active.id,
        createdAt: new Date(active._doc.createdAt).toISOString(),
        updatedAt: new Date(active._doc.updatedAt).toISOString(),
      };
    },
    createBet: async (args, req) => {
      // const user = await User.findOne({dataToken: args.betInput.dataToken});
      // if(!user){
      //   throw new Error("Session expired!!!");
      // }
      const account = await Account.findOne({ user: args.betInput.user });
      if(+account.balance <0){
          throw new Error("Insufficient account account balance");
      }
      const dublicateBet = await Bet.findOne({
        user: args.betInput.user,
        round: args.betInput.round,
      });
      // if (dublicateBet) {
      //   throw new Error("Already placed a bet!");
      // }
      const bet = new Bet({
        nonce: args.betInput.nonce,
        clientSeed: args.betInput.clientSeed,
        amount: args.betInput.amount,
        betAmount: args.betInput.betAmount,
        serverSeed: args.betInput.serverSeed,
        point: args.betInput.point,
        round: dublicateBet?+args.betInput.round+100:args.betInput.round,
        win: args.betInput.win,
        auto: args.betInput.auto,
        user: args.betInput.user,
        tax: args.betInput.tax,
        crush:parseFloat(args.betInput.crush),
        balance:`${account.balance}`
      });
      const results = await bet.save();
  
      const houseAccount = await house.findOne({
        user: "62fb898a4a4d42002392750d",
      });
      
  
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: `User ${args.betInput.win ? "won " : "lost"} ${
          args.betInput.win ? parseFloat(+args.betInput.amount).toFixed(2) : parseFloat(+args.betInput.betAmount).toFixed(2)
        }`,
        user: args.betInput.user,
        round: args.betInput.round,
        won: args.betInput.win,
        at: parseFloat(args.betInput.point),
        crush: parseFloat(args.betInput.crush),
        balance:`${account.balance}`
      });
      await log.save();
  
      // let filter = { user: args.betInput.user };
      // let update = {
      //   balance:`${args.betInput.win
      //     ? +account?.balance +
      //       +args?.betInput?.amount +
      //       +args?.betInput?.betAmount
      //     : account?.balance}`,
      // };
      // await Account.findOneAndUpdate(filter, update);
  
      let userProfit = +args?.betInput?.amount + +args?.betInput?.tax;
      houseAccount.houseTotal = args.betInput.win
        ? +houseAccount?.houseTotal - +userProfit
        : +houseAccount?.houseTotal +
          +args?.betInput?.betAmount;
  
      await houseAccount.save();
      return {
        ...results._doc,
        _id: results.id,
        user: singleUser.bind(this, results._doc.user),
        createdAt: new Date(results._doc.createdAt).toISOString(),
        updatedAt: new Date(results._doc.updatedAt).toISOString(),
      };
    },
    createTransaction: async (args, req) => {
      const transaction = new Transaction({
        type: args.transactionInput.type,
        amount: args.transactionInput.amount,
        user: req.userId,
      });
  
      const transact = await transaction.save();
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: `Added a transaction`,
        user: args.transactionInput.user,
      });
  
      await log.save();
      return {
        ...transact._doc,
        _id: transact.id,
        user: singleUser.bind(this, transact._doc.user),
        createdAt: new Date(transact._doc.createdAt).toISOString(),
        updatedAt: new Date(transact._doc.updatedAt).toISOString(),
      };
    },
    createLogs: async (args, req) => {
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: args.logsInput.description,
        user: args.logsInput.userId,
        round: args.logsInput.round,
      });
  
  
      const results = await log.save();
  
      return {
        ...results._doc,
        _id: results.id,
        user: singleUser.bind(this, results._doc.user),
        createdAt: new Date(results._doc.createdAt).toISOString(),
        updatedAt: new Date(results._doc.updatedAt).toISOString(),
      };
    },
    updateHouse: async (args, req) => {
      const log = new house({
        houseTotal: 0,
        user: args.userId,
      });
  
      const results = await log.save();
  
      return {
        ...results._doc,
        _id: results.id,
        createdAt: new Date(results._doc.createdAt).toISOString(),
        updatedAt: new Date(results._doc.updatedAt).toISOString(),
      };
    },
    createGameData: async (args, req) => {
      const game = new Game({
        round: args.round,
        level: args.level,
      });
  
      const results = await game.save();
  
      return {
        ...results._doc,
        _id: results.id,
        user: singleUser.bind(this, results._doc.user),
        createdAt: new Date(results._doc.createdAt).toISOString(),
        updatedAt: new Date(results._doc.updatedAt).toISOString(),
      };
    },
    
    generateAdminOtp: async (args, req) => {
      const user = await Admin.findOne({ username: args.username });
      if (!user) {
        throw new Error("Invalid user!!!");
      }
      const otp = otpGenerator.generate(5, {
        upperCaseAlphabets: true,
        lowerCaseAlphabets: false,
        digits: true,
        specialChars: false,
      });
  
      const otpCreator = new OTP({
        otp: otp,
        verified: false,
        user: user.id,
      });
      const generator = await otpCreator.save();
      var options = {
        method: "POST",
        url: "https://sms.securifier.co.ke/SMSApi/send",
        headers: {
          Headers: "Content-Type:application/json",
        },
        formData: {
          userid: "safaribust",
          password: "qghckqHE",
          mobile: `${user.phone}`,
          senderid: "SAFARIBUST",
          msg: `OTP: ${otp}`,
          sendMethod: "quick",
          msgType: "text",
          output: "json",
          duplicatecheck: "true",
        },
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
      });
  
      const ipAddress = req.socket.remoteAddress;
      const log = new AdminLog({
        ip: ipAddress,
        description: `${user.username} sent an OTP to ${user.phone}`,
        user: generator.user._id,
      });
  
      await log.save();
      return {
        ...generator._doc,
        _id: generator.id,
        user: singleUser.bind(this, generator._doc.user),
        createdAt: new Date(generator._doc.createdAt).toISOString(),
        updatedAt: new Date(generator._doc.updatedAt).toISOString(),
      };
    },
    generateOtp: async (args, req) => {
      const user = await User.findOne({ username: args.username });
      const otp = otpGenerator.generate(5, {
        upperCaseAlphabets: true,
        lowerCaseAlphabets: false,
        digits: true,
        specialChars: false,
      });
  
      const otpCreator = new OTP({
        otp: otp,
        verified: false,
        user:user? user.id:null,
      });
      const generator = await otpCreator.save();
  
      var options = {
        method: "POST",
        url: "https://sms.securifier.co.ke/SMSApi/send",
        headers: {
          Headers: "Content-Type:application/json",
        },
        formData: {
          userid: "safaribust",
          password: "qghckqHE",
          mobile: `${user?user.phone:args.phone}`,
          senderid: "SAFARIBUST",
          msg: `OTP: ${otp}`,
          sendMethod: "quick",
          msgType: "text",
          output: "json",
          duplicatecheck: "true",
        },
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
      });
  
      const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: ipAddress,
        description: ` OTP sent an to ${user?user.phone.substr(
          1,
          13
        ):args.phone} - Username: ${args.username}`,
        user: user?user._id:null,
      });
  
      await log.save();
  
      return {
        ...generator._doc,
        _id: generator.id,
        user: singleUser.bind(this, generator._doc.user),
        createdAt: new Date(generator._doc.createdAt).toISOString(),
        updatedAt: new Date(generator._doc.updatedAt).toISOString(),
      };
    },
  }
  