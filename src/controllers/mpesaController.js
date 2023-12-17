require("dotenv").config();

const axios = require("axios");
const formatDate = require("../utils/formatDate");

//importing mongoose models
const Account = require("../models/Account");
const Transaction = require("../models/transactions");
const Transrequest = require("../models/Transrequest");

const Logs = require("../models/logs");
const Player = require("../models/Player");
let unirest = require("unirest");

const mpesaResolvers = {
  depositTest: async (args, req) => {
    const currentUser = req.user;

    // console.log(currentUser);

    const phoneNumber = formatKenyanPhoneNumber(args.phone);

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }
    try {
      const consumer_key = process.env.PESAXPRESS_KEY;
      const consumer_secret = process.env.PESAXPRESS_SECRET;
      const url =
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

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
        const shortcode = process.env.MPESAEXPRESS_CODE;
        const passkey = process.env.PESAXPRESS_PASSKEY;
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
              PartyA: phoneNumber,
              PartyB: shortcode,
              PhoneNumber: phoneNumber,
              CallBackURL:
                "https://safaribust-backend.onrender.com/mpesa-callback",
              AccountReference: phoneNumber,
              TransactionDesc: "Deposit to SAFARIBUST Account",
            })
          )
          .end(async (res) => {
            if (res.body.ResponseCode == "0") {
              // User id not found
              const account = await Account.findOne({
                user: currentUser.userId,
              });

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
                user: currentUser.userId,
              });

              await transrequest.save();

              const user = await Player.findById(currentUser.userId);

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
    const currentUser = req.user;

    if (!currentUser) {
      throw new Error("Unauthorized: Missing token");
    }

    const account = await Account.findOne({ user: req.user.userId });

    if (parseFloat(args.amount) > parseFloat(account.balance)) {
      throw new Error("Insufficient balance in your wallet");
    }

    const ipAddress = req.socket.remoteAddress;

    try {
      const consumer_key = process.env.B2C_KEY;
      const consumer_secret = process.env.B2C_SECRET;
      const url =
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
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
        const shortcode = process.env.B2C_SHORTCODE;
        const passkey = process.env.B2C_PASSKEY;

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
              Remarks: `Customer Withdrawal`,
              QueueTimeOutURL:
                "https://safaribust-backend.onrender.com/transaction-timeout",
              ResultURL:
                "https://safaribust-backend.onrender.com/transaction-result",
              Occassion: `Customer Withdrawal`,
            })
          )
          .end(async (res) => {
            // console.log(res.body);

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

function formatKenyanPhoneNumber(phoneNumber) {
  // Remove any spaces and non-numeric characters
  phoneNumber = phoneNumber.replace(/\D/g, "");

  // Check if the phone number starts with "254" and has 12 digits (including the country code)
  if (/^254\d{9}$/.test(phoneNumber)) {
    return phoneNumber; // Phone number is already in the correct format
  } else if (/^0\d{9}$/.test(phoneNumber)) {
    // Add "254" in front of the phone number
    return "254" + phoneNumber.slice(1);
  } else {
    // Handle invalid phone numbers
    return "Invalid phone number";
  }
}

module.exports = mpesaResolvers;
