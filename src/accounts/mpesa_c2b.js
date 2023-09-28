const moment = require("moment");
const unirest = require("unirest");
const Account = require("../models/Account");
const PaybillC2B = require("../models/PaybillC2B");
const PaybillStk = require("../models/PaybillStk");
const Payments = require("../models/Payments");
const OperationClass = require("./transactionclass");

const getApiToken = async () => {
  let accessToken = "";
  const data = process.env.MPESA_API_KEY + ":" + process.env.MPESA_API_SECRET;

  const tokendata = Buffer.from(data).toString("base64");
  accessToken = await unirest(
    "GET",
    process.env.MPESA_URL + "/oauth/v1/generate?grant_type=client_credentials"
  )
    .headers({
      Authorization: "Basic " + tokendata,
    })
    .send();
  return accessToken.body.access_token;
};

const stkpush = async (amount, user) => {
  try {
    const accessToken = await getApiToken();
    if (!accessToken) {
      return {
        status: "error",
        message: "Api failure",
      };
    }
    try {
      // mpesa request
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const data =
        process.env.MPESA_CODE + process.env.MPESA_PASS_KEY + timestamp;
      const password = Buffer.from(data).toString("base64");
      //   console.log("user ;" + user);
      // console.log(Env.get('MPESA_API_URL') + '/api/v1/callback/express')
      await unirest(
        "POST",
        process.env.MPESA_URL + "/mpesa/stkpush/v1/processrequest"
      )
        .headers({
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        })
        .send(
          JSON.stringify({
            BusinessShortCode: process.env.MPESA_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: user.phoneNumber,
            PartyB: process.env.MPESA_CODE,
            PhoneNumber: user.phoneNumber,
            CallBackURL: process.env.MPESA_API_URL + "/api/v1/callback/express",
            AccountReference: user.account.accountNumber,
            TransactionDesc: "Top Up Account",
          })
        )
        .end((res) => {
          if (res.error) {
            //console.log("error1", res.error);
            return {
              status: "error",
              message: "Request failed, please try again later",
            };
          }
          /* start get body and catch error...add to db */
          //console.log("resrp", res.body);
          try {
            PaybillStk.create({
              MerchantRequestID: res.body.MerchantRequestID,
              CheckoutRequestID: res.body.CheckoutRequestID,
              account: user.account,
            });
          } catch (error) {
            return {
              status: "error",
              message: "Request failed, please try again later",
            };
          }
          //console.log(12333);
          /* End get body and catch error...add to db */
          return {
            status: "success",
            message: "Check your phone and enter pin",
          };
        });
    } catch (error) {
      return {
        status: "error",
        message: "Request failed, please try again later",
      };
    }
  } catch (e) {
    //console.log(45555);
    // throw new Error(e);
    return { status: "error", message: "The request failed" };
  }
};

/* start mpesa callback for stk...add to db */
const expressSTK = async (request, response) => {
  // console.log(request.body.Body.stkCallback.CallbackMetadata);
  const userResponse = request.body.Body.stkCallback;
  const transaction = await PaybillStk.findOne({
    CheckoutRequestID: userResponse.CheckoutRequestID,
  });
  // console.log(transaction);
  if (userResponse.ResultCode === 1032) {
    transaction.ResultCode = userResponse.ResultCode;
    await transaction.save();
    // send sms transaction failed
  } else {
    const transactionItem = userResponse.CallbackMetadata.Item;
    transaction.ResultCode = userResponse.ResultCode;
    transactionItem.forEach((Item) => {
      switch (Item.Name) {
        case "Amount":
          transaction.Amount = Item.Value;
          break;
        case "MpesaReceiptNumber":
          transaction.MpesaReceiptNumber = Item.Value;
          break;
        case "TransactionDate":
          transaction.TransactionDate = Item.Value;
          break;
        case "PhoneNumber":
          transaction.PhoneNumber = Item.Value;
          break;
        default:
          break;
      }
    });
    await transaction.save();

    // Check if payment has already been saved
    const payment = await Payments.findOne({
      transCode: transaction.MpesaReceiptNumber,
    });
    if (payment !== null) {
      return response.status(200).send("success");
    }
    // End Check if payment has already been saved

    const payments = {
      amount: transaction.Amount,
      transType: "payBillOnline",
      transCode: transaction.MpesaReceiptNumber,
      timestamp: transaction.TransactionDate,
      payments_id: transaction.id,
      account: transaction.account,
    };
    await Payments.create(payments);
    const savedPayment = await Payments.findOne({
      transCode: payments.transCode,
    }).populate("account");
    const account = savedPayment.account;

    account.balance += payments.amount;
    // TO DO: add the funds to account
    const recordTrans = new OperationClass();
    await recordTrans.deposit(payments);
    // console.log(account);

    await account.save();
    //console.log(account.balance);
    // emit user deposit seccefully
    return response.status(200).send("ok");
  }
};

const validation = async (request, response) => {
  const mpesa = request.body;
  // const mpesa = await PaybillC2B.create(mpesaResponse)
  const account = await Account.findOne({ accountNumber: mpesa.BillRefNumber });
  if (!account) {
    return response.status(200).send({
      ResultCode: "C2B00012",
      ResultDesc: "Rejected",
    });
  } else {
    return response.status(200).send({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};

const registerUrl = async (request, response) => {
  const accessToken = await getApiToken();
  //console.log(accessToken);
  if (!accessToken) {
    return {
      status: "error",
      message: "Api failure",
    };
  }
  await unirest("POST", process.env.MPESA_URL + "/mpesa/c2b/v2/registerurl")
    .headers({
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    })
    .send(
      JSON.stringify({
        ShortCode: process.env.MPESA_CODE,
        ResponseType: "Completed",
        ConfirmationURL:
          process.env.MPESA_API_URL + "/api/v1/callback/confirmation",
        ValidationURL:
          process.env.MPESA_API_URL + "/api/v1/callback/validation",
      })
    )
    .end((res) => {
      if (res.error) {
        //console.log(res);
        return response.status(400).send({
          status: "error",
          message: "Request failed, check details",
        });
      }
      return response.status(200).send({
        status: "success",
        message: res.body,
      });
    });
};

const confirmation = async (request, response) => {
  const mpesaResponse = request.body;
  const mpesa = await PaybillC2B.create(mpesaResponse);
  const account = await Account.findOne({
    accountNumber: mpesa.BillRefNumber,
  });
  if (!account) {
    return response.status(200).send({
      ResultCode: "C2B00012",
      ResultDesc: "Rejected",
    });
  }

  // Check if payment has already been saved
  const payment = await Payments.findOne({
    transCode: mpesa.TransID,
  });
  if (payment !== null) {
    return response.status(200).send("success");
  }
  // End Check if payment has already been saved

  const payments = {
    amount: parseInt(mpesa.TransAmount),
    transType: mpesa.TransactionType,
    transCode: mpesa.TransID,
    timestamp: mpesa.TransTime,
    payments_id: mpesa.id,
    account: account,
  };
  await Payments.create(payments);
  account.balance += payments.amount;
  // TO DO: add the funds to account
  const recordTrans = new OperationClass();
  recordTrans.deposit(payments);
  await account.save();
  // emit account deposit seccefully
  return response.status(200).send("ok");
};

module.exports = { stkpush, expressSTK, validation, registerUrl, confirmation };
