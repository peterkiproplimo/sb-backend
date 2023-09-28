const Organization = require("../models/Organization");
const Transaction = require("../models/transactions");

class OperationClass {
  async deposit(data) {
    const transactionData = {
      amount: data.amount,
      transCode: data.transCode,
      type: "deposit",
      account: data.account,
    };
    try {
      const OrganizationData = await Organization.findOne().sort({
        createdAt: -1,
      });
      // console.log(OrganizationData);
      let newOrganizationData = {};
      if (!OrganizationData) {
        newOrganizationData = {
          totalFunds: Number(transactionData.amount),
          walletFunds: Number(transactionData.amount),
          houseFunds: 0,
          waitingFunds: 0,
          withdrawals: 0,
        };
      } else {
        newOrganizationData = {
          totalTax: OrganizationData.totalTax,
          totalFunds:
            OrganizationData.totalFunds + Number(transactionData.amount),
          walletFunds:
            OrganizationData.walletFunds + Number(transactionData.amount),
          houseFunds: OrganizationData.houseFunds,
          waitingFunds: OrganizationData.waitingFunds,
          withdrawals: OrganizationData.withdrawals,
        };
      }
      await Organization.create(newOrganizationData);
      await Transaction.create(transactionData);
      // emit Organization update event
      return "ok";
    } catch (error) {
      // console.log(error)
      return "failed";
    }
  }

  async betplace(data) {
    const transactionData = {
      amount: data.amount,
      transCode: await this.generateTransCode(),
      type: "bet",
      account: data.account,
    };
    const OrganizationData = await Organization.findOne().sort({
      createdAt: -1,
    });
    const newOrganizationData = {
      totalTax: OrganizationData.totalTax,
      totalFunds: OrganizationData.totalFunds,
      walletFunds:
        OrganizationData.walletFunds - parseInt(Number(transactionData.amount)),
      houseFunds: OrganizationData.houseFunds,
      waitingFunds:
        OrganizationData.waitingFunds +
        parseInt(Number(transactionData.amount)),
      withdrawals: OrganizationData.withdrawals,
    };
    await Organization.create(newOrganizationData);
    await Transaction.create(transactionData);
    // emit Organization update event
    return "ok";
  }

  async generateTransCode() {
    const arrOfDigits = Array.from(String(Date.now()), Number);
    let Code = [];
    let toChars = "";
    await arrOfDigits.forEach((n) => {
      toChars = `${n >= 26 ? toChars(Math.floor(n / 26) - 1) : ""}${
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26]
      }`;
      Code.push(toChars);
    });
    Code = await Code.join("");
    return Code;
  }

  async betWin(data) {
    const transactionData = {
      taxAmount: data.taxAmount,
      winnings: data.winnings,
      winAmount: data.winAmount,
      amount: data.amount,
      transCode: await this.generateTransCode(),
      type: "bet",
      account: data.account,
    };
    const OrganizationData = await Organization.findOne().sort({
      createdAt: -1,
    });
    // const payIns =
    //   OrganizationData.waitingFunds - Number(transactionData.amount);
    const newOrganizationData = {
      totalTax: OrganizationData.totalTax + transactionData.taxAmount,
      totalFunds: OrganizationData.totalFunds,
      walletFunds:
        OrganizationData.walletFunds + Number(transactionData.amount),
      houseFunds: OrganizationData.houseFunds,
      waitingFunds: OrganizationData.waitingFunds - transactionData.winnings,
      withdrawals: OrganizationData.withdrawals,
    };
    // console.log(OrganizationData)
    // console.log(newOrganizationData)
    await Organization.create(newOrganizationData);
    await Transaction.create(transactionData);
    // emit Organization update event
    return "ok";
  }

  async betEnded() {
    // console.log('active')
    const OrganizationData = await Organization.findOne().sort({
      createdAt: -1,
    });
    if (!OrganizationData || OrganizationData.waitingFunds === 0) {
      return "ok";
    } else {
      let payIns = OrganizationData.waitingFunds;
      if (payIns <= 0) {
        payIns = 0;
      }
      const newOrganizationData = {
        totalTax: OrganizationData.totalTax,
        totalFunds: OrganizationData.totalFunds,
        walletFunds: OrganizationData.walletFunds,
        houseFunds: OrganizationData.houseFunds + payIns,
        waitingFunds: 0,
        withdrawals: OrganizationData.withdrawals,
      };
      // console.log(OrganizationData)
      // console.log(newOrganizationData)
      await Organization.create(newOrganizationData);
      // await Transaction.create({
      //   amount: payIns,
      //   transCode: await this.generateTransCode(),
      //   type: "bet",
      //   user_id: "1",
      // });
      // emit Organization update event
      return "ok";
    }
  }

  async withdraw(data) {
    const transactionData = {
      amount: data.amount,
      transCode: data.transCode,
      type: "withdrawal",
      account: data.account,
    };
    try {
      const OrganizationData = await Organization.findOne().sort({
        createdAt: -1,
      });
      const newOrganizationData = {
        totalTax: OrganizationData.totalTax,
        totalFunds:
          OrganizationData.totalFunds - Number(transactionData.amount),
        walletFunds:
          OrganizationData.walletFunds - Number(transactionData.amount),
        houseFunds: OrganizationData.houseFunds,
        waitingFunds: OrganizationData.waitingFunds,
        withdrawals:
          OrganizationData.withdrawals + Number(transactionData.amount),
      };
      await Organization.create(newOrganizationData);
      await Transaction.create(transactionData);
      // emit Organization update event
      return "ok";
    } catch (error) {
      // console.log(error)
      return "failed";
    }
  }
}
module.exports = OperationClass;
