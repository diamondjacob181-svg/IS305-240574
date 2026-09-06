/*
  Program: DiningAccount Base Class
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Base class for dining accounts with deposits and meal payments.
*/

class DiningAccount {
  #accountNumber;
  #balance;
  #transactions;

  constructor(accountNumber, openingBalance = 0) {
    if (!accountNumber || accountNumber.trim() === "") {
      throw new Error("Account number cannot be empty.");
    }
    if (openingBalance < 0) {
      throw new Error("Opening balance cannot be negative.");
    }

    this.#accountNumber = accountNumber;
    this.#balance = openingBalance;
    this.#transactions = [];
  }

  // Deposit with optional description
  deposit(amount, description = "Deposit") {
    if (amount <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }
    this.#balance += amount;
    this.#transactions.push({ type: "Deposit", amount, description });
  }

  // Pay for meal
  payForMeal(amount, description = "Meal Payment") {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }
    if (this.#balance < amount) {
      console.log("Insufficient funds. Payment rejected.");
      return false;
    }
    this.#balance -= amount;
    this.#transactions.push({ type: "Payment", amount, description });
    console.log("Payment successful.");
    return true;
  }

  getBalance() {
    return this.#balance;
  }

  getTransactions() {
    return [...this.#transactions]; // safe copy
  }

  displayAccountSummary() {
    console.log("========================================");
    console.log("       STANDARD DINING ACCOUNT");
    console.log("========================================");
    console.log(`Account Number: ${this.#accountNumber}`);
    console.log(`Current Balance: K${this.#balance.toFixed(2)}`);
    console.log("========================================");
  }
}

module.exports = DiningAccount;
