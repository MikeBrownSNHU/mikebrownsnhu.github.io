/**
 * @file authentication.js
 * @description Controller for user registration and login endpoints.
 * Uses Passport.js local strategy for credential verification.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Added try/catch to register to handle unexpected errors
 * - Added basic email format validation before hitting the database
 * - Improved error messages to be more helpful without leaking info
 * - Added comments explaining the Passport authenticate flow
 * 
 * @author Mike Brown
 */

const passport = require('passport');
const mongoose = require('mongoose');
const User = require('../models/user');

/**
 * POST /api/register
 * Creates a new user account and returns a JWT on success.
 * Validates that all required fields are present and email format is valid.
 * @param {Object} req - Express request (expects name, email, password in body)
 * @param {Object} res - Express response
 */
const register = async (req, res) => {
  try {
    // Check for required fields
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'All fields required (name, email, password)' });
    }

    // Basic email format check - not perfect but catches obvious typos
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check minimum password length for basic security
    if (req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);

    const savedUser = await user.save();
    const token = savedUser.generateJWT();
    return res.status(200).json({ token });
  } catch (err) {
    // Handle duplicate email (unique constraint violation)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }
    return res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

/**
 * POST /api/login
 * Authenticates a user and returns a JWT on success.
 * Delegates actual credential checking to Passport's local strategy.
 * 
 * Note: passport.authenticate returns a middleware function, so we call
 * it immediately with (req, res) at the end. The callback gives us control
 * over the response instead of letting Passport redirect.
 * 
 * @param {Object} req - Express request (expects email, password in body)
 * @param {Object} res - Express response
 */
const login = (req, res) => {
  // Check for required fields before bothering Passport
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Use Passport with a custom callback so we control the response
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error', error: err.message });
    }

    if (user) {
      // Auth succeeded - generate JWT and send it back
      const token = user.generateJWT();
      return res.status(200).json({ token });
    } else {
      // Auth failed - wrong email or password
      // Don't specify which one was wrong (security best practice)
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  })(req, res);
};

module.exports = {
  register,
  login
};
