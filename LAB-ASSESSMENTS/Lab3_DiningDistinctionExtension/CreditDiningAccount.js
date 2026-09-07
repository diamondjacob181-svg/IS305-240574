/*
  Program: CreditDiningAccount Subclass
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Dining account with credit limit functionality.
*/

const DiningAccount = require("./DiningAccount");

class CreditDiningAccount extends DiningAccount {
  #creditLimit;

  constructor(accountNumber, openingBalance, creditLimit) {
    super(accountNumber, openingBalance);
    if (creditLimit < 0) throw new Error("Credit limit cannot be negative.");
    this.#creditLimit = creditLimit;
  }

  // Override payForMeal
  payForMeal(amount, description = "Meal Payment") {
    if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
    const availableFunds = this.getBalance() + this.#creditLimit;
    if (amount > availableFunds) {
      console.log("Payment rejected: exceeds credit limit.");
      return false;
    }
    const newBalance = this.getBalance() - amount;
    this._updateBalance(newBalance);
    this._recordTransaction("Meal Payment", amount, description, newBalance);
    console.log("Payment successful.");
    return true;
  }

  displayAccountSummary() {
    console.log(`
========================================
       CREDIT DINING ACCOUNT
========================================
Account Number: ${this.getTransactions()[0].type === "Opening Balance" ? this.getTransactions()[0].description : ""}
Current Balance: K${this.getBalance().toFixed(2)}
Credit Limit: K${this.#creditLimit.toFixed(2)}
========================================
    `);
  }
}

module.exports = CreditDiningAccount;
