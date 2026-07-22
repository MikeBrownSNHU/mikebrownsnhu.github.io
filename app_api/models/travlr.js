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
 * Enhancement Notes (CS-499 Category 2 - Algorithms & Data Structures):
 * - Added compound text index on name + description for full-text search
 * - Added index on resort field for filtered queries
 * - Added index on perPerson field for price range queries
 * - These indexes support efficient search, filter, and sort operations
 *   without full collection scans
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
    index: true, // Index for resort filter queries
    trim: true
  },
  perPerson: {
    type: Number, // Was String - should be numeric (dollar amount)
    required: true,
    index: true, // Index for price range queries
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

/**
 * Compound text index on name and description fields.
 * Enables MongoDB $text search operator for keyword queries.
 * Weights prioritize name matches (3x) over description matches (1x).
 * 
 * This is a key data structure enhancement: text indexes use an inverted
 * index structure (similar to search engines) where each word maps to the
 * documents containing it, enabling O(1) lookup per term vs O(n) regex scan.
 */
tripSchema.index(
  { name: 'text', description: 'text' },
  { weights: { name: 3, description: 1 }, name: 'trip_text_search' }
);

const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;
