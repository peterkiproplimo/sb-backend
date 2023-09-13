const unirest = require("unirest");
MsgSendHPK = async (msg, phone) => {
  await unirest
    .get(
      "https://smsportal.hostpinnacle.co.ke/SMSApi/send?userid=machina&password=56zBWzyb&sendMethod=quick&mobile=" +
        phone +
        "&msg=" +
        msg +
        "&senderid=HPKSMS&msgType=text&duplicatecheck=true&trackLink=true&smartLinkTitle=click here&output=json"
    )
    .then((res) => {
      return "success";
    });
};

const MsgSend = async (msg, phone) => {
  let smssent = "";
  const data =
    process.env.PATASMS_USERNAME + ":" + process.env.PATASMS_PASSWORD;

  const tokendata = Buffer.from(data).toString("base64");
  smssent = await unirest("POST", "https://api.patasms.com/send_one")
    .headers({
      Authorization: "Basic " + tokendata,
    })
    .send(
      JSON.stringify({
        sender: process.env.PATASMS_SENDER,
        recipient: phone,
        message: msg,
        bulk: 1,
        link_Id: "89023478214892134789234",
        call_back: "",
      })
    )
    .then((response) => {
      // console.log(response);
    });
  return "OK";
};
module.exports = { MsgSend };
