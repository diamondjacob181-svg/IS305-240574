📖 Lab 2 – Student and Meal Booking Integration
Extension from Lab 1

Lab 1 introduced a simple meal booking system. Lab 2 extended this by introducing a Student class and connecting it to the MealBooking class.
Student Class

    Implemented with private fields: #studentId, #firstName, #lastName.

    Constructor validates required fields.

    Getters and controlled setters allow safe updates.

    Methods: getFullName() and displayInfo() for formatted output.

Integration with MealBooking

    MealBooking now stores a Student object instead of separate ID and name.

    Booking summaries display student details via the connected object.

    Duplicate bookings are prevented.

    Validation ensures correct meal type and quantity.

Booking History

    Added displayBookingHistory() to show:

        Student details once.

        All bookings for that student.

        Total number of bookings.

        Combined cost of bookings.

Controlled Updates

    Updating a student’s name via setters automatically updates all connected booking summaries
