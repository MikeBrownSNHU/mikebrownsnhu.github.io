/**
 * @file index.js (API routes)
 * @description Defines all REST API routes for the Travlr application.
 * Maps HTTP methods to controller functions and applies JWT auth middleware.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Fixed critical JWT middleware bug: next() was called outside the verify
 *   callback, meaning requests would continue even if auth failed.
 * - Added role-based access control (admin role required for write operations)
 * - Added proper comments explaining each route group
 * 
 * @author Mike Brown
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const tripsController = require('../controllers/trips');
const authController = require('../controllers/authentication');

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token from the Authorization header.
 * 
 * BUG FIX: The original code called next() unconditionally after jwt.verify().
 * Since verify is async with a callback, next() ran immediately regardless
 * of whether the token was valid. Moved next() inside the success path.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware function
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  // No auth header at all
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header required' });
  }

  // Expecting format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];
  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  // Verify the token - next() only called on success now
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token validation failed' });
    }
    // Attach decoded user info to request for downstream use
    req.auth = decoded;
    next(); // Only proceed if token is valid
  });
}

/**
 * Role-Based Access Middleware
 * Checks if the authenticated user has the required role.
 * Must be used AFTER authenticateJWT so req.auth is populated.
 * @param {string} role - Required role (e.g., 'admin')
 */
function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.auth || req.auth.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions. Admin access required.' });
    }
    next();
  };
}

// --- Trip Routes ---
// Public: anyone can view trips
// Protected: must be authenticated AND have admin role to create/update
router
  .route('/trips')
  .get(tripsController.tripsList)
  .post(authenticateJWT, authorizeRole('admin'), tripsController.tripsAddTrip);

router
  .route('/trips/:tripCode')
  .get(tripsController.tripsFindByCode)
  .put(authenticateJWT, authorizeRole('admin'), tripsController.tripsUpdateTrip);

// --- Auth Routes ---
// Public endpoints for login and registration
router
  .route('/login')
  .post(authController.login);

router
  .route('/register')
  .post(authController.register);

module.exports = router;
