/*
  Program: Dining Meal Booking Feature
  Name: George Jacob
  ID: 240574
  Date: 21 July 2026
  Description: Node.js console application demonstrating
  classes, objects, constructors, private fields and methods.
*/

const readline = require("readline");
const MealBooking = require("./MealBooking");

// Store all bookings in an array
const bookings = [];

// Duplicate check
function isDuplicate(studentId, mealDate, mealType) {
  return bookings.some(
    (b) => b.studentId === studentId && b.mealDate === mealDate && b.mealType === mealType
  );
}

// Console input setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    const studentId = await askQuestion("Enter Student ID: ");
    const studentName = await askQuestion("Enter Student Name: ");
    const mealDate = await askQuestion("Enter Meal Date (YYYY-MM-DD): ");
    const mealType = await askQuestion("Enter Meal Type (Breakfast/Lunch/Dinner): ");
    const quantity = parseInt(await askQuestion("Enter Quantity: "), 10);
    const dietaryNote = await askQuestion("Enter Dietary Note: ");

    // Duplicate prevention
    if (isDuplicate(studentId, mealDate, mealType)) {
      console.log("Error: Duplicate booking detected. Booking rejected.");
      rl.close();
      return;
    }

    // Create booking
    const booking = new MealBooking(studentId, studentName, mealDate, mealType, quantity, dietaryNote);

    // Validation
    if (!studentId || !studentName || !mealDate) {
      throw new Error("Missing required booking information.");
    }
    if (!["Breakfast", "Lunch", "Dinner"].includes(mealType)) {
      throw new Error("Invalid meal type. Must be Breakfast, Lunch, or Dinner.");
    }
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    // Add booking to array
    bookings.push(booking);

    // Display receipt
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

