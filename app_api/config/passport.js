/**
 * @file passport.js
 * @description Passport.js local strategy configuration.
 * Tells Passport how to authenticate users using email + password.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Wrapped the strategy in try/catch to handle unexpected DB errors
 * - Changed error messages to not reveal whether email or password was wrong
 *   (prevents account enumeration attacks)
 * - Added comments explaining how this connects to the login flow
 * 
 * @author Mike Brown
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('../models/user');

/**
 * Local Strategy Configuration
 * 
 * This tells Passport to use 'email' as the username field and
 * look up users in MongoDB. The done() callback follows the pattern:
 *   done(error, user, info)
 * 
 * When login is called in the auth controller, Passport runs this
 * strategy to verify the credentials before we generate a JWT.
 */
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ email: username });

      if (!user) {
        // Don't reveal that the email doesn't exist (security)
        return done(null, false, { message: 'Invalid credentials' });
      }

      if (!user.validPassword(password)) {
        // Same generic message - don't tell them which field was wrong
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Both email and password are valid
      return done(null, user);
    } catch (err) {
      // Database or unexpected error
      return done(err);
    }
  }
));
