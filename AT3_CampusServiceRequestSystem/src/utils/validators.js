'use strict';

/**
This file is the validation helper for the whole system
It stores allowed categories, priorities, statuses, and user types
and provides functions to check names, emails, valid options, and generate the current date/time.
 */

const CATEGORIES = Object.freeze([
  'ICT Support',
  'Facilities Maintenance',
  'Cleaning and Sanitation',
  'General Campus Service',
]);

const PRIORITIES = Object.freeze(['Low', 'Normal', 'High', 'Urgent']);

const STATUSES = Object.freeze([
  'Submitted',
  'Reviewed',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
  'Cancelled',
]);

const USER_TYPES = Object.freeze([
  'StudentRequester',
  'StaffRequester',
  'ServiceOfficer',
  'Technician',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return isNonEmptyString(value) && EMAIL_PATTERN.test(value.trim());
}

function isOneOf(value, list) {
  return Array.isArray(list) && list.includes(value);
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  USER_TYPES,
  isNonEmptyString,
  isValidEmail,
  isOneOf,
  nowIso,
};
