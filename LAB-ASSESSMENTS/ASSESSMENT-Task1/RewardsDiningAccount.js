/*
  Program: RewardsDiningAccount Subclass
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Subclass of DiningAccount with rewards functionality.
*/

const DiningAccount = require("./DiningAccount");

class RewardsDiningAccount extends DiningAccount {
  #rewardRate;

  constructor(accountNumber, openingBalance, rewardRate) {
    super(accountNumber, openingBalance);
    this.#rewardRate = rewardRate;
  }

  calculateReward() {
    return (this.getBalance() * this.#rewardRate) / 100;
  }

  applyReward() {
    const reward = this.calculateReward();
    this.deposit(reward, "Reward Applied");
    return reward;
  }

  displayAccountSummary() {
    console.log("========================================");
    console.log("        REWARDS DINING ACCOUNT");
    console.log("========================================");
    console.log(`Account Number: ${this.accountNumber}`);
    console.log(`Reward Rate: ${this.#rewardRate}%`);
    console.log(`Current Balance: K${this.getBalance().toFixed(2)}`);
    console.log("========================================");
  }
}

module.exports = RewardsDiningAccount;
