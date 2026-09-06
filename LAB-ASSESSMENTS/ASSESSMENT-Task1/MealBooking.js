/*
  Program: Dining Meal Booking Feature
  Student Name: George Jacob
  Student ID: 240574
  Date: 3 September 2026
  Description: Node.js console application integrating Student and MealBooking classes.
*/

const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");

const bookings = [];

function isDuplicate(studentId, mealDate, mealType) {
  return bookings.some(
    (b) => b.studentId === studentId && b.mealDate === mealDate && b.mealType === mealType
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    // Student details
    const studentId = await askQuestion("Enter Student ID: ");
    const firstName = await askQuestion("Enter First Name: ");
    const lastName = await askQuestion("Enter Last Name: ");

    const student = new Student(studentId, firstName, lastName);
    console.log(student.displayInfo());

    // Meal booking details
    const mealDate = await askQuestion("Enter Meal Date (YYYY-MM-DD): ");
    const mealType = await askQuestion("Enter Meal Type (Breakfast/Lunch/Dinner): ");
    const quantity = parseInt(await askQuestion("Enter Quantity: "), 10);
    const dietaryNote = await askQuestion("Enter Dietary Note: ");

    if (isDuplicate(studentId, mealDate, mealType)) {
      console.log("Error: Duplicate booking detected. Booking rejected.");
      rl.close();
      return;
    }

    const booking = new MealBooking(studentId, student.getFullName(), mealDate, mealType, quantity, dietaryNote);

    if (!["Breakfast", "Lunch", "Dinner"].includes(mealType)) {
      throw new Error("Invalid meal type. Must be Breakfast, Lunch, or Dinner.");
    }
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    bookings.push(booking);

    console.log("\n========================================");
    console.log("          BOOKING CREATED");
    console.log("========================================");
    console.log(booking.getSummary());

  } catch (error) {
    console.error("Booking failed:", error.message);
  } finally {
    rl.close();
  }
}

main();

