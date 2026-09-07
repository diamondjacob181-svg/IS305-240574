/*
  Program: DiningAccount Base Class
  Student Name: George Jacob
  Student ID: 240574
  Date: 08 September 2026
  Description: Base dining account with deposits, payments, and transaction history.
*/

class DiningAccount {
  #accountNumber;
  #balance;
  #transactions;

  constructor(accountNumber, openingBalance = 0) {
    if (!accountNumber) throw new Error("Account number cannot be empty.");
    if (openingBalance < 0) throw new Error("Opening balance cannot be negative.");
    this.#accountNumber = accountNumber;
    this.#balance = openingBalance;
    this.#transactions = [];
    this._recordTransaction("Opening Balance", openingBalance, "Initial deposit", openingBalance);
  }

  getBalance() { return this.#balance; }
  getTransactions() { return [...this.#transactions]; }

  deposit(amount, description = "Deposit") {
    if (amount <= 0) throw new Error("Deposit amount must be greater than zero.");
    this.#balance += amount;
    this._recordTransaction("Deposit", amount, description, this.#balance);
  }

  payForMeal(amount, description = "Meal Payment") {
    if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
    if (amount > this.#balance) {
      console.log("Payment rejected: insufficient funds.");
      return false;
    }
    this.#balance -= amount;
    this._recordTransaction("Meal Payment", amount, description, this.#balance);
    console.log("Payment successful.");
    return true;
  }

  displayAccountSummary() {
    console.log(`
========================================
       STANDARD DINING ACCOUNT
========================================
Account Number: ${this.#accountNumber}
Current Balance: K${this.#balance.toFixed(2)}
========================================
    `);
  }

  // Protected helpers for subclasses
  _updateBalance(newBalance) { this.#balance = newBalance; }
  _recordTransaction(type, amount, description, balanceAfter) {
    this.#transactions.push({
      type,
      amount,
      description,
      date: new Date().toLocaleString(),
      balance: balanceAfter
    });
  }
}

module.exports = DiningAccount;
