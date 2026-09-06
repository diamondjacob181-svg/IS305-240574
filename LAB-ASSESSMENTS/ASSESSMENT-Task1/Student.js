/*
  Program: Student Class
  Student Name: George Jacob
  Student ID: 240574
  Date: 3 September 2026
  Description: A JavaScript class demonstrating private fields,
  constructor, getters, setters, and methods.
*/

class Student {
  #studentId;
  #firstName;
  #lastName;

  constructor(studentId, firstName, lastName) {
    this.studentId = studentId;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  // Getters
  get studentId() { return this.#studentId; }
  get firstName() { return this.#firstName; }
  get lastName() { return this.#lastName; }

  // Setters with validation
  set studentId(value) {
    if (!value || value.trim() === "") throw new Error("Student ID cannot be empty.");
    this.#studentId = value;
  }
  set firstName(value) {
    if (!value || value.trim() === "") throw new Error("First name cannot be empty.");
    this.#firstName = value;
  }
  set lastName(value) {
    if (!value || value.trim() === "") throw new Error("Last name cannot be empty.");
    this.#lastName = value;
  }

  // Methods
  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  displayInfo() {
    return `
========================================
             STUDENT DETAILS
========================================
Student ID: ${this.#studentId}
Student Name: ${this.getFullName()}
========================================
    `;
  }
}

module.exports = Student;
