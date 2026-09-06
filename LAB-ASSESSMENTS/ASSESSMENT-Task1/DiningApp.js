/*
  Program: Dining Application (Lab 2 Part 2)
  Student Name: George Jacob
  Student ID: 240574
  Date: 6 September 2026
  Description: Integrates Student and MealBooking classes with booking history.
*/

const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");

const bookings = [];

function isDuplicate(student, mealDate, mealType) {
  return bookings.some(
    (b) => b.student.studentId === student.studentId && b.mealDate === mealDate && b.mealType === mealType
  );
}

function displayBookingHistory(student, bookings) {
  const studentBookings = bookings.filter(b => b.student.studentId === student.studentId);

  console.log(student.displayInfo());
  console.log("========================================");
  console.log("            BOOKING HISTORY");
  console.log("========================================");

  let totalCost = 0;
  studentBookings.forEach((b, index) => {
    console.log(`${index + 1}. ${b.mealType} - ${b.mealDate}`);
    console.log(`   Quantity: ${b.quantity}`);
    console.log(`   Status: ${b.bookingStatus}`);
    console.log(`   Cost: K${b.calculateTotal().toFixed(2)}\n`);
    totalCost += b.calculateTotal();
  });

  console.log(`Total Bookings: ${studentBookings.length}`);
  console.log(`Combined Cost: K${totalCost.toFixed(2)}`);
  console.log("========================================");
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

    if (isDuplicate(student, mealDate, mealType)) {
      console.log("Error: Duplicate booking detected. Booking rejected.");
      rl.close();
      return;
    }

    const booking = new MealBooking(student, mealDate, mealType, quantity, dietaryNote);

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

    // Show booking history
    displayBookingHistory(student, bookings);

  } catch (error) {
    console.error("Booking failed:", error.message);
  } finally {
    rl.close();
  }
}

main();


