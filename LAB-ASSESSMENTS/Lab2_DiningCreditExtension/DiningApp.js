/*
  Program: Dining Meal Booking Application
  Student Name: George Jacob
  Student ID: 240574
  Date: 5 September 2026
  Description: Complete Node.js console application for meal booking with Student integration.
*/

const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");

// Store all bookings in an array
const bookings = [];

// Duplicate check
function isDuplicate(studentId, mealDate, mealType) {
  return bookings.some(
    (b) => b.student.studentId === studentId && b.mealDate === mealDate && b.mealType === mealType
  );
}

// Booking history
function displayBookingHistory(student, bookings) {
  const studentBookings = bookings.filter(b => b.student.studentId === student.studentId);
  if (studentBookings.length === 0) {
    console.log("No bookings found for this student.");
    return;
  }

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
    console.log("========================================");
    console.log("       DWU DINING MEAL BOOKING");
    console.log("========================================");

    const studentId = await askQuestion("Enter Student ID: ");
    const firstName = await askQuestion("Enter First Name: ");
    const lastName = await askQuestion("Enter Last Name: ");

    // Create Student object
    const student = new Student(studentId, firstName, lastName);

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
    const booking = new MealBooking(student, mealDate, mealType, quantity, dietaryNote);

    // Validation
    booking.validate();

    // Add booking to array
    bookings.push(booking);

    // Display receipt
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
