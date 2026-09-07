Lab 3 – Dining Accounts and Distinction Extension
Extension from Lab 2

Lab 3 builds on Lab 2 by adding DiningAccount classes and integrating payments with meal bookings.
Class Hierarchy

- DiningAccount (Base Class)

- Private fields: #accountNumber, #balance, #transactions.

- Methods: deposit(), payForMeal(), getBalance(), getTransactions(), displayAccountSummary().

- Demonstrates simulated overloading with optional parameters.

    RewardsDiningAccount (Subclass)

- Inherits from DiningAccount.

- Adds #rewardRate.

- Methods: calculateReward(), applyReward().

- Demonstrates constructor chaining using super().

    CreditDiningAccount (Subclass)

- Inherits from DiningAccount.

- Adds #creditLimit.

- Overrides payForMeal() to allow payments using credit.

- Demonstrates method overriding and polymorphism.

Integration with Student and MealBooking

- A Student object can be connected to a dining account.

- MealBooking payments are processed through the assigned account.

- Successful payments confirm the booking; failed payments reject it.

- Transaction history records deposits, payments, and rewards.

Polymorphism Demonstration

- An array of accounts (DiningAccount, RewardsDiningAccount, CreditDiningAccount) is used to show polymorphic behavior.
