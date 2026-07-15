/**
 * @file travlr.js
 * @description Mongoose schema/model for Trip documents.
 * Defines the structure and validation for trip records in MongoDB.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Changed 'length' from String to Number (it represents days, not text)
 * - Changed 'perPerson' from String to Number (it's a dollar amount)
 * - Added 'unique: true' on code field to prevent duplicate trips
 * - Added trim to string fields to avoid whitespace issues
 * - Added min validators on numeric fields
 * 
 * @author Mike Brown
 */

const mongoose = require('mongoose');

// Trip schema - represents a travel package offered by Travlr Getaways
const tripSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true, // Each trip must have a unique code
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  length: {
    type: Number, // Was String - should be numeric (number of nights)
    required: true,
    min: [1, 'Trip length must be at least 1 night']
  },
  start: {
    type: Date,
    required: true
  },
  resort: {
    type: String,
    required: true,
    trim: true
  },
  perPerson: {
    type: Number, // Was String - should be numeric (dollar amount)
    required: true,
    min: [0, 'Price per person cannot be negative']
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;
