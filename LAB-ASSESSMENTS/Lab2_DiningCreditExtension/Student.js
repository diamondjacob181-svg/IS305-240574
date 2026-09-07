/*
  Program: Student Class
  Student Name: George Jacob
  Student ID: 240574
  Date: 4 September 2026
  Description: Class representing a student with private fields and controlled updates.
*/

class Student {
  #studentId;
  #firstName;
  #lastName;

  constructor(studentId, firstName, lastName) {
    if (!studentId || !firstName || !lastName) {
      throw new Error("Invalid student information. All fields are required.");
    }
    this.#studentId = studentId;
    this.#firstName = firstName;
    this.#lastName = lastName;
  }

  // Getters
  get studentId() { return this.#studentId; }
  get firstName() { return this.#firstName; }
  get lastName() { return this.#lastName; }

  // Controlled updates
  setFirstName(newFirstName) {
    if (!newFirstName) throw new Error("First name cannot be empty.");
    this.#firstName = newFirstName;
  }

  setLastName(newLastName) {
    if (!newLastName) throw new Error("Last name cannot be empty.");
    this.#lastName = newLastName;
  }

  // Display methods
  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  displayInfo() {
    return `
========================================
          STUDENT INFORMATION
========================================
Student ID: ${this.#studentId}
Student Name: ${this.getFullName()}
========================================
    `;
  }
}

module.exports = Student;
