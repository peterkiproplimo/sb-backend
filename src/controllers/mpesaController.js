require("dotenv").config();

const axios = require("axios");
const formatDate = require("../utils/formatDate");

var mysql = require("mysql");

//importing mongoose models
const Account = require("../models/Account");
const Transaction = require("../models/transactions");
const Transrequest = require("../models/Transrequest");

const Logs = require("../models/logs");
const Player = require("../models/Player");
const Mpesa = require("mpesa-node");
let unirest = require("unirest");

const mpesaResolvers = {
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
                "https://safaribust-backend.onrender.com/mpesa-callback",
              AccountReference: parseInt(args.phone),
              TransactionDesc: "Deposit to SAFARIBUST Account",
            })
          )
          .end(async (res) => {
            if (res.body.ResponseCode == "0") {
              const account = await Account.findOne({ user: args.userId });
              console.log(res.body);
              const trans = new Transaction({
                type: 1,
                MerchantRequestID: res.body.MerchantRequestID,
                CheckoutRequestID: res.body.CheckoutRequestID,
                trans_time: timestamp,
                amount: args.amount,
                phone: args.phone,
                user: args.userId,
                account: account,
              });
              await trans.save();

              const transrequest = new Transrequest({
                amount: args.amount,
                phone: args.phone,
                user: args.userId,
              });

              await transrequest.save();

              const user = await Player.findById(args.userId);

              return {
                _id: account?.id,
                balance: account?.balance,
                user: user,
                createdAt: new Date(account?._doc?.createdAt).toISOString(),
                updatedAt: new Date(account?._doc?.updatedAt).toISOString(),
                active: account?.active,
              };
            }
          });
      }
    } catch (err) {
      console.log(err);
    }
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
      const authString = `${consumer_key}:${consumer_secret}`;

      // Convert the string to a Buffer
      const buffer = Buffer.from(authString, "utf-8");

      // Encode the Buffer as Base64
      const auth = buffer.toString("base64");
      console.log(auth);
      const { data } = await axios.get(url, {
        headers: { Authorization: "Basic" + " " + auth },
      });
      if (data.access_token) {
        const timestamp = formatDate();
        const shortcode = 3034427;
        const passkey =
          "BCZcLvkd0lJU+AkbjLcbesMIdn4viqoI9B9jhiTMs2yJlxWAiLTeNm/ftOXz9rlgWdqHlMOW1JirTs/yGpH/yad/BECGKjCtrC0Wi0sj7e1vgoutLBgzXaUrNkSPQxE9aPAuw1Of4DROwy1eYtby+M0Ir/3qFDEWprkn/RRdsLGfaIv5leWGOa1SIbv0vdY13gBQAT1h2kiMWbyHZKgzcO90mZ5GerfUJk/ID4s/3DF+XkOe0Zmfg/1hX8va36SI67gY2OOlf60fYp5Ss2p1ISlE6qgudSd76Qxk3xTf9QhdoJmGPFt5Izq828h90+T139kINIkoOikMPcKYrvbCXA==";

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
                "https://safaribust-backend.onrender.com/mpesa-timeout",
              ResultURL: "https://safaribust-backend.onrender.com/mpesa-result",
              Occassion: `Withdrawal: ${args.username}-${args.phone}`,
            })
          )
          .end(async (res) => {
            console.log(res.body);
            if (res.error) throw new Error(res.error);
            let filter = { user: args.userId };
            let update = {
              balance: parseFloat(account?.balance) - parseFloat(args.amount),
            };
            await Account.findOneAndUpdate(filter, update);

            const trans = new Transaction({
              type: 2,
              OriginatorConversationID: res.body.OriginatorConversationID,
              ConversationID: res.body.ConversationID,
              trans_time: timestamp,
              amount: parseInt(args.amount),
              phone: args.phone,
              user: args.userId,
              account: account,
            });

            await trans.save();

            const log = new Logs({
              ip: ipAddress,
              description: `Withdrawn ${args.amount} - Account Name:${args.phone}`,
              user: args.userId,
            });
            await log.save();
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
