/*
  Program: MealBooking Class (Refactored for Lab 2 Part 2)
  Student Name: George Jacob
  Student ID: 240574
  Date: 3 September 2026
  Description: MealBooking now stores a Student object reference.
*/

const Student = require("./Student");

class MealBooking {
  #student;       // Student object reference
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  constructor(student, mealDate, mealType, quantity, dietaryNote) {
    if (!(student instanceof Student)) {
      throw new Error("Invalid Student object provided.");
    }
    this.#student = student;
    this.#mealDate = mealDate;
    this.#mealType = mealType;
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote;
    this.#bookingStatus = "Pending"; // default
  }

  // Getters
  get student() { return this.#student; }
  get mealDate() { return this.#mealDate; }
  get mealType() { return this.#mealType; }
  get quantity() { return this.#quantity; }
  get dietaryNote() { return this.#dietaryNote; }
  get bookingStatus() { return this.#bookingStatus; }

  // Setters
  set mealDate(date) { this.#mealDate = date; }
  set mealType(type) { this.#mealType = type; }
  set quantity(qty) { this.#quantity = qty; }
  set dietaryNote(note) { this.#dietaryNote = note; }
  set bookingStatus(status) { this.#bookingStatus = status; }

  // Method to calculate total cost
  calculateTotal() {
    let price = 0;
    if (this.#mealType === "Breakfast") price = 10;
    else if (this.#mealType === "Lunch") price = 15;
    else if (this.#mealType === "Dinner") price = 20;
    return price * this.#quantity;
  }

  // Method to return booking summary
  getSummary() {
    return `
    Booking Summary:
    Student: ${this.#student.getFullName()} (ID: ${this.#student.studentId})
    Meal: ${this.#mealType} on ${this.#mealDate}
    Quantity: ${this.#quantity}
    Dietary Note: ${this.#dietaryNote}
    Status: ${this.#bookingStatus}
    Total Cost: K${this.calculateTotal().toFixed(2)}
    `;
  }
}

module.exports = MealBooking;


