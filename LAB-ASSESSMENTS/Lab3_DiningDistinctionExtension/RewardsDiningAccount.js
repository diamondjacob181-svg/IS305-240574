/*
  Program: RewardsDiningAccount Subclass
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Dining account with reward rate functionality.
*/

const DiningAccount = require("./DiningAccount");

class RewardsDiningAccount extends DiningAccount {
  #rewardRate;

  constructor(accountNumber, openingBalance, rewardRate) {
    super(accountNumber, openingBalance);
    if (rewardRate <= 0) throw new Error("Reward rate must be positive.");
    this.#rewardRate = rewardRate;
  }

  calculateReward() {
    return this.getBalance() * this.#rewardRate / 100;
  }

  applyReward() {
    const reward = this.calculateReward();
    this._updateBalance(this.getBalance() + reward);
    this._recordTransaction("Reward", reward, `Reward at ${this.#rewardRate}%`, this.getBalance());
    return reward;
  }

  displayAccountSummary() {
    console.log(`
========================================
        REWARDS DINING ACCOUNT
========================================
Account Number: ${this.getTransactions()[0].type === "Opening Balance" ? this.getTransactions()[0].description : ""}
Balance: K${this.getBalance().toFixed(2)}
Reward Rate: ${this.#rewardRate}%
========================================
    `);
  }
}

module.exports = RewardsDiningAccount;
