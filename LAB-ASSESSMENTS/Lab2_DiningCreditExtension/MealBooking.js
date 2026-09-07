/*
  Program: MealBooking Class
  Student Name: George Jacob
  Student ID: 240574
  Date: 5 September 2026
  Description: Class representing a dining meal booking connected to a Student object.
*/

class MealBooking {
  #student; // Student object
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  constructor(student, mealDate, mealType, quantity, dietaryNote) {
    if (!(student && student.studentId && student.firstName && student.lastName)) {
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

  // Validation
  validate() {
    if (!this.#mealDate) throw new Error("Meal date is required.");
    if (!["Breakfast", "Lunch", "Dinner"].includes(this.#mealType)) {
      throw new Error("Invalid meal type. Must be Breakfast, Lunch, or Dinner.");
    }
    if (this.#quantity < 1) throw new Error("Quantity must be at least 1.");
    return true;
  }

  // Calculate total cost
  calculateTotal() {
    let price = 0;
    if (this.#mealType === "Breakfast") price = 10;
    else if (this.#mealType === "Lunch") price = 15;
    else if (this.#mealType === "Dinner") price = 20;
    return price * this.#quantity;
  }

  // Controlled methods
  confirmBooking() { this.#bookingStatus = "Confirmed"; }
  cancelBooking() { this.#bookingStatus = "Cancelled"; }

  // Summary receipt
  getSummary() {
    return `
========================================
          BOOKING CREATED
========================================
${this.#student.displayInfo()}
Meal: ${this.#mealType} x ${this.#quantity}
Date: ${this.#mealDate}
Dietary note: ${this.#dietaryNote}
Status: ${this.#bookingStatus}
Total cost: K${this.calculateTotal().toFixed(2)}
========================================
    `;
  }
}

module.exports = MealBooking;
