/**
 * @file app.js
 * @description Main Express application setup for Travlr Getaways.
 * Configures middleware, routes, view engine, and error handling.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Fixed dual error handlers that conflicted with each other.
 *   The original had an Unauthorized handler AND a generic handler, but
 *   the Unauthorized one would swallow errors before the generic one ran.
 *   Combined them into a single, unified error handler.
 * - Added helmet middleware for HTTP security headers
 * - Replaced 'var' with 'const' throughout (modern JS best practice)
 * - Added comments explaining the middleware pipeline
 * 
 * @author Mike Brown
 */

require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet'); // Security headers middleware

const indexRouter = require('./app_server/routes/index');
const travelRouter = require('./app_server/routes/travel');
const apiRouter = require('./app_api/routes/index');

const handlebars = require('hbs');

// Wire in authentication via Passport
const passport = require('passport');
require('./app_api/config/passport');

const app = express();

// Connect to MongoDB
require('./app_api/models/db');

// --- Security Middleware ---
// Helmet sets various HTTP headers to protect against common attacks
// like clickjacking, XSS, MIME sniffing, etc.
app.use(helmet());

// --- View Engine Setup ---
app.set('views', path.join(__dirname, 'app_server', 'views'));
handlebars.registerPartials(__dirname + '/app_server/views/partials');
app.set('view engine', 'hbs');

// --- Standard Middleware ---
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// --- CORS Configuration ---
// Allow the Angular admin app (localhost:4200) to call our API
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// --- Route Registration ---
app.use('/', indexRouter);
app.use('/travel', travelRouter);
app.use('/api', apiRouter);

// --- Error Handling ---

// Catch 404 and forward to the error handler
app.use(function(req, res, next) {
  next(createError(404));
});

/**
 * Unified Error Handler
 * 
 * Fixed: the original had TWO error handlers. The first caught
 * UnauthorizedError but didn't call next(), so the second handler
 * (which renders the error page) would never run for other errors
 * that slipped past. Now it's one handler that checks the error type.
 */
app.use(function(err, req, res, next) {
  // Handle JWT/auth errors with a JSON response (for API calls)
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized: ' + err.message });
  }

  // For all other errors, render the error page (server-side views)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
