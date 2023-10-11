require("dotenv").config();

const axios = require("axios");
const formatDate = require("../utils/formatDate");

var mysql = require("mysql");

//importing mongoose models
const Account = require("../models/Account");
const Transaction = require("../models/transactions");
const Logs = require("../models/logs");
const Player = require("../models/Player");
const Mpesa = require("mpesa-node");
let unirest = require("unirest");

const mpesaApi = new Mpesa({
  consumerKey: "ROqiKlEFF9Gb4BmYtTbhPlxk0NYfATg8",
  consumerSecret: "R8Kd6wFX6ot3L7Th",
});

const mpesaResolvers = {
  deposit: async (args, req) => {
    try {
      const consumer_key = "ROqiKlEFF9Gb4BmYtTbhPlxk0NYfATg8";
      const consumer_secret = "R8Kd6wFX6ot3L7Th";
      const url =
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
      const auth = btoa(`${consumer_key}:${consumer_secret}`);
      const { data } = await axios.get(url, {
        headers: { Authorization: "Basic" + " " + auth },
      });
      if (data.access_token) {
        const timestamp = formatDate();
        const shortcode = 174379;
        const passkey =
          "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMTYwMjE2MTY1NjI3";
        const password = Buffer.from(shortcode + passkey + timestamp).toString(
          "base64"
        );

        let unirest = require("unirest");
        let req = unirest(
          "POST",
          "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )
          .headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access_token}`,
            Host: "api.safaricom.co.ke",
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
                "https://sb-backend-test.onrender.com/mpesa-callback",
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
              database: "bustadmin_paydb",
            });
            con.connect(function (err) {
              if (err) throw err;
              setInterval(() => {
                con.query(
                  `SELECT * FROM transaction WHERE bill_ref_number='${args.phone}' ORDER BY trans_time DESC`,
                  function (err, result) {
                    if (err) throw err;
                    let data = [];

                    Object.keys(result).forEach(async function (key) {
                      var row = result[key];
                      const transaction = await Transaction.findOne({
                        trans_id: row.trans_id,
                      });
                      data.push(row.trans_id);
                      if (!transaction) {
                        const trans = new Transaction({
                          type: "Deposit",
                          trans_id: row.trans_id,
                          bill_ref_number: row.bill_ref_number,
                          trans_time: row.trans_time,
                          amount: row.trans_amount,
                          user: args.userId,
                        });
                        await trans.save();
                        const account = await Account.findOne({
                          user: args.userId,
                        });
                        account.balance =
                          parseFloat(account?.balance) +
                          parseFloat(row.trans_amount);
                        await account.save();
                        // const ipAddress = req.socket.remoteAddress;
                        const log = new Logs({
                          ip: "deposits",
                          description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
                          user: args.userId,
                        });
                        await log.save();
                        con.end(() => console.log("connection closed"));
                      }
                      con.end(() => console.log("connection closed"));
                    });
                  },
                  10000
                );
              });
            });
            con.destroy();
          });
      }
    } catch (err) {
      console.log(err);
    }
  },

  depositTest: async (args, req) => {
    try {
      const consumer_key = "5PEvsVfLvBHx3SaJszsuJvzUEMIC3KGu";
      const consumer_secret = "lnqSApRJLo3ahd20";
      const url =
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

      // const auth = btoa(`${consumer_key}:${consumer_secret}`);
      const authString = `${consumer_key}:${consumer_secret}`;

      // Convert the string to a Buffer
      const buffer = Buffer.from(authString, "utf-8");

      // Encode the Buffer as Base64
      const auth = buffer.toString("base64");

      const { data } = await axios.get(url, {
        headers: { Authorization: "Basic" + " " + auth },
      });
      if (data.access_token) {
        const timestamp = formatDate();
        const shortcode = 200038;
        const passkey =
          "1b4a4259275aa64f74807e4bce8bd0a2f99e4059c510ebd1721af80f0d3b1a10";
        const password = Buffer.from(shortcode + passkey + timestamp).toString(
          "base64"
        );

        console.log(password);

        let req = unirest(
          "POST",
          "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )
          .headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access_token}`,
            Host: "api.safaricom.co.ke",
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
                "https://sb-backend-test.onrender.com/mpesa-callback",
              AccountReference: parseInt(args.phone),
              TransactionDesc: "Deposit to SAFARIBUST Account",
            })
          )
          .end(async (res) => {
            console.log(res.body);
            const trans = new Transaction({
              type: "Deposit",
              MerchantRequestID: res.body.MerchantRequestID,
              CheckoutRequestID: res.body.CheckoutRequestID,
              trans_time: timestamp,
              amount: args.amount,
              phone: args.phone,
              user: args.userId,
            });
            await trans.save();

            const account = await Account.findOne({
              user: args.userId,
            });

            if (account.isfirstdebosit && parseFloat(args.amount) >= 100) {
              account.karibubonus = parseFloat(args.amount) * 2;
              account.isfirstdebosit = false;
              const currentDate = new Date();
              const sevenDaysLater = new Date(currentDate);
              sevenDaysLater.setDate(currentDate.getDate() + 7);
              const formattedDate = sevenDaysLater
                .toISOString()
                .replace(/\.000/, "");

              account.bonusexpirydate = formattedDate;
            }

            account.balance =
              parseFloat(account?.balance) + parseFloat(args.amount);
            await account.save();
            // const ipAddress = req.socket.remoteAddress;
            const log = new Logs({
              ip: "deposits",
              description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
              user: args.userId,
            });
            await log.save();

            const user = await Player.findById(args.userId);
            return {
              _id: account?.id,
              balance: account?.balance,
              user: user,
              createdAt: new Date(account?._doc?.createdAt).toISOString(),
              updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
              active: account?.active,
            };
          });
      }
    } catch (err) {
      console.log(err);
    }
  },
  depositTestBackup: async (args, req) => {
    console.log(args);
    try {
      const trans = new Transaction({
        type: "Deposit",
        trans_id: " row.trans_id",
        bill_ref_number: "row.bill_ref_number",
        trans_time: "row.trans_time",
        amount: args.amount,
        user: args.userId,
      });
      await trans.save();

      const account = await Account.findOne({
        user: args.userId,
      });

      if (account.isfirstdebosit && parseFloat(args.amount) >= 100) {
        account.karibubonus = parseFloat(args.amount) * 2;
        account.isfirstdebosit = false;
        const currentDate = new Date();
        const sevenDaysLater = new Date(currentDate);
        sevenDaysLater.setDate(currentDate.getDate() + 7);
        const formattedDate = sevenDaysLater.toISOString().replace(/\.000/, "");

        account.bonusexpirydate = formattedDate;
      }

      account.balance = parseFloat(account?.balance) + parseFloat(args.amount);
      await account.save();
      // const ipAddress = req.socket.remoteAddress;
      const log = new Logs({
        ip: "deposits",
        description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
        user: args.userId,
      });
      await log.save();

      const user = await Player.findById(args.userId);
      return {
        _id: account?.id,
        balance: account?.balance,
        user: user,
        createdAt: new Date(account?._doc?.createdAt).toISOString(),
        updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
        active: account?.active,
      };
    } catch (err) {
      console.log(err);
    }
  },

  depositManual: (args, req) => {
    var con = mysql.createConnection({
      host: "173.214.168.54",
      user: "bustadmin_dbadm",
      password: ";,bp~AcEX,*a",
      database: "bustadmin_paydb",
    });
    con.connect(function (err) {
      if (err) throw err;

      con.query(
        `SELECT * FROM transaction WHERE bill_ref_number='${args.phone}' ORDER BY trans_time DESC`,
        function (err, result) {
          if (err) throw err;
          let data = [];

          Object.keys(result).forEach(async function (key) {
            var row = result[key];
            const transaction = await Transaction.findOne({
              trans_id: row.trans_id,
            });
            data.push(row.trans_id);
            if (!transaction) {
              const trans = new Transaction({
                type: "Deposit",
                trans_id: row.trans_id,
                bill_ref_number: row.bill_ref_number,
                trans_time: row.trans_time,
                amount: row.trans_amount,
                user: args.userId,
              });
              await trans.save();
              const account = await Account.findOne({ user: args.userId });
              account.balance =
                parseFloat(account?.balance) + parseFloat(row.trans_amount);
              await account.save();
              // const ipAddress = req.socket.remoteAddress;
              const log = new Logs({
                ip: "deposits",
                description: `${account?.user?.username} deposited ${args.amount}- Account Name:${account?.user?.username}`,
                user: args.userId,
              });
              await log.save();
            }
          });

          con.destroy();
        }
      );
    });
  },

  withdraw: async (args, req) => {
    const account = await Account.findOne({ user: args.userId });

    if (parseFloat(args.amount) > parseFloat(account.balance)) {
      throw new Error("Insufficient balance in your wallet");
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
            Host: "api.safaricom.co.ke",
          })
          .send(
            JSON.stringify({
              InitiatorName: "KARIUKI",
              SecurityCredential: passkey,
              CommandID: "BusinessPayment",
              Amount: parseInt(args.amount),
              PartyA: shortcode,
              PartyB: parseInt(args.phone),
              Remarks: `Withdrawal: ${args.username}-${args.phone}`,
              QueueTimeOutURL:
                "https://www.safaribust.co.ke/pesaxpress/B2C/timeout.php",
              ResultURL:
                "https://www.safaribust.co.ke/pesaxpress/B2C/result.php",
              Occassion: `Withdrawal: ${args.username}-${args.phone}`,
            })
          )
          .end(async (res) => {
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
            await og.save();
          });
      }
    } catch (err) {
      console.log(err);
    }
  },

  withdrawTest: async (args, req) => {
    const account = await Account.findOne({ user: args.userId });

    if (parseFloat(args.amount) > parseFloat(account.balance)) {
      throw new Error("Insufficient balance in your wallet");
    }

    try {
      let filter = { user: args.userId };
      let update = {
        balance: parseFloat(account?.balance) - parseFloat(args.amount),
      };
      await Account.findOneAndUpdate(filter, update);
      const log = new Logs({
        ip: "ipAddress",
        description: `Withdrawn ${args.amount} - Account Name:${args.phone}`,
        user: args.userId,
      });

      await log.save();

      const user = await Player.findById(args.userId);
      return {
        _id: account?.id,
        balance: account?.balance,
        user: user,
        createdAt: new Date(account?._doc?.createdAt).toISOString(),
        updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
        active: account?.active,
      };
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
        const password = Buffer.from(shortcode + passkey + timestamp).toString(
          "base64"
        );

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
              QueueTimeOutURL: "https://mydomain.com/TransactionStatus/queue/",
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
};

module.exports = mpesaResolvers;
