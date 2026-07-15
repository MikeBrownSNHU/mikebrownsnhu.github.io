/**
 * @file user.js
 * @description Mongoose schema/model for User documents.
 * Handles password hashing, validation, and JWT generation.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Increased PBKDF2 iterations from 1000 to 210000 (OWASP 2023 recommendation)
 *   The original 1000 iterations is far too low for modern hardware.
 * - Added 'role' field to support role-based access control
 * - Replaced 'var' with 'const' for consistency
 * - Added role to JWT payload so the API can check permissions
 * - Added comments explaining the crypto approach
 * 
 * @author Mike Brown
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true // Normalize emails to avoid duplicates like User@Test vs user@test
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'], // Only allow these two roles
    default: 'user' // New registrations default to regular user
  },
  hash: String,
  salt: String
});

/**
 * Sets the password hash and salt on this user record.
 * Uses PBKDF2 with a random salt - this is a one-way operation.
 * The password itself is never stored.
 * @param {string} password - Plain text password from the user
 */
userSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  // 210000 iterations per OWASP guidelines (was 1000 - way too low)
  this.hash = crypto.pbkdf2Sync(
    password,
    this.salt,
    210000,
    64,
    'sha512'
  ).toString('hex');
};

/**
 * Validates a password attempt against the stored hash.
 * Runs the same PBKDF2 with the stored salt and compares results.
 * @param {string} password - Plain text password attempt
 * @returns {boolean} True if password matches
 */
userSchema.methods.validPassword = function(password) {
  const hash = crypto.pbkdf2Sync(
    password,
    this.salt,
    210000,
    64,
    'sha512'
  ).toString('hex');
  return this.hash === hash;
};

/**
 * Generates a signed JWT for this user.
 * Token includes user ID, email, name, and role for authorization checks.
 * Expires in 1 hour to limit exposure if a token is compromised.
 * @returns {string} Signed JWT string
 */
userSchema.methods.generateJWT = function() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role // Include role so API middleware can check permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const User = mongoose.model('users', userSchema);
module.exports = User;
