# Campus Service Request Management System

**Student Name:** <George Jacob
**Student ID:** 240574
**Course:** IS305 – Object-Oriented Programming
**Assessment:** IS305 Major Project


## Project Description
A Node.js console application that lets students and staff submit, track and
cancel campus service requests (ICT, maintenance, cleaning and general), while
service officers and technicians review, assign, progress, resolve and close
those requests. Data is persisted to local JSON files (no database).

## Achievement Components Attempted
- **Pass:** ✔ Core classes, validation, arrays, full console workflow
- **Credit:** ✔ Inheritance, constructor chaining, role permissions, history, filters
- **Distinction:** ✔ Polymorphism, abstract-style base class, JSON persistence, audit trail, reports, automated tests

## Features
- Register StudentRequester / StaffRequester / ServiceOfficer / Technician users
- Submit ICT, Maintenance, Cleaning and General requests
- Search by ID or title; filter by category/status/priority/technician; sort by date and priority
- Full workflow: Submitted → Reviewed → Assigned → In Progress → Resolved → Closed (+ Cancelled)
- Role-based permissions enforced in code
- Request history and audit trail
- 10+ management reports
- JSON persistence through repository classes
- 12 automated tests using `node:test`

## Folder Structure
AT3_CampusServiceRequestSystem/
├── package.json
├── README.md
├── data/ # JSON data files (auto-created/updated)
├── src/
│ ├── CampusServiceApp.js
│ ├── models/ # Domain classes (User, ServiceRequest, subclasses, factories)
│ ├── managers/ # ServiceRequestManager
│ ├── repositories/ # JSON file repositories
│ └── utils/ # validators
└── tests/
└── system.test.js
