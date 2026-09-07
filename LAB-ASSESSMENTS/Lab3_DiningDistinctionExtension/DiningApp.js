/*
  Program: Dining Meal Booking Application (Lab 3 Extension)
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Application integrating Student, MealBooking, and DiningAccount subclasses.
*/

const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");
const DiningAccount = require("./DiningAccount");
const RewardsDiningAccount = require("./RewardsDiningAccount");
const CreditDiningAccount = require("./CreditDiningAccount");

const bookings = [];

// Console input setup (global rl)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Transaction history display
function displayTransactionHistory(account) {
  const transactions = account.getTransactions();
  console.log("========================================");
  console.log("          TRANSACTION HISTORY");
  console.log("========================================");
  transactions.forEach((t, index) => {
    console.log(`${index + 1}. ${t.type} - K${t.amount.toFixed(2)}`);
    console.log(`   Description: ${t.description}`);
    console.log(`   Balance: K${t.balance.toFixed(2)}\n`);
  });
  console.log(`Total Transactions: ${transactions.length}`);
  console.log("========================================");
}

async function main() {
  try {
    console.log("========================================");
    console.log("       DWU DINING MEAL BOOKING");
    console.log("========================================");

    const studentId = await askQuestion("Enter Student ID: ");
    const firstName = await askQuestion("Enter First Name: ");
    const lastName = await askQuestion("Enter Last Name: ");

    const student = new Student(studentId, firstName, lastName);

    // Use RewardsDiningAccount for demonstration
    const account = new RewardsDiningAccount("RA001", 100, 2.5);

    console.log(`
========================================
          STUDENT DINING ACCOUNT
========================================
Student: ${student.getFullName()}
Student ID: ${student.studentId}
Account Type: RewardsDiningAccount
Account Number: RA001
Opening Balance: K${account.getBalance().toFixed(2)}
    `);

    const mealDate = await askQuestion("Enter Meal Date (YYYY-MM-DD): ");
    const mealType = await askQuestion("Enter Meal Type (Breakfast/Lunch/Dinner): ");
    const quantity = parseInt(await askQuestion("Enter Quantity: "), 10);
    const dietaryNote = await askQuestion("Enter Dietary Note: ");

    const booking = new MealBooking(student, mealDate, mealType, quantity, dietaryNote);

    if (booking.validate()) {
      const success = account.payForMeal(booking.calculateTotal(), `${mealType} booking`);
      if (success) {
        booking.confirmBooking();
      }

      bookings.push(booking);

      console.log(`
========================================
             MEAL BOOKING
========================================
Meal: ${mealType}
Quantity: ${quantity}
Total Cost: K${booking.calculateTotal().toFixed(2)}
Payment Status: ${success ? "Successful" : "Failed"}
Booking Status: ${booking.bookingStatus}
Remaining Balance: K${account.getBalance().toFixed(2)}
      `);

      displayTransactionHistory(account);
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    rl.close();
  }
}

main();
