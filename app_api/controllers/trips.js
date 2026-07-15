/**
 * @file trips.js
 * @description Controller for trip CRUD operations.
 * Handles GET, POST, and PUT requests for the /api/trips endpoint.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Added try/catch blocks for proper error handling (original had none)
 * - Renamed vague 'q' variables to descriptive names
 * - Added input validation before database writes
 * - Used findOne() instead of find() for single-record lookups
 * - Added JSDoc comments for maintainability
 * 
 * @author Mike Brown
 */

const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const Model = mongoose.model('trips');

/**
 * GET /api/trips
 * Retrieves all trips from the database.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const tripsList = async (req, res) => {
  try {
    const trips = await Model.find({}).exec();

    if (!trips || trips.length === 0) {
      return res.status(404).json({ message: 'No trips found' });
    }

    return res.status(200).json(trips);
  } catch (err) {
    return res.status(500).json({ message: 'Server error retrieving trips', error: err.message });
  }
};

/**
 * GET /api/trips/:tripCode
 * Finds a single trip by its unique code.
 * Fixed: uses findOne() instead of find() since we expect one result.
 * @param {Object} req - Express request object (req.params.tripCode)
 * @param {Object} res - Express response object
 */
const tripsFindByCode = async (req, res) => {
  try {
    const tripCode = req.params.tripCode;

    if (!tripCode) {
      return res.status(400).json({ message: 'Trip code is required' });
    }

    const trip = await Model.findOne({ code: tripCode }).exec();

    if (!trip) {
      return res.status(404).json({ message: `Trip not found with code: ${tripCode}` });
    }

    return res.status(200).json(trip);
  } catch (err) {
    return res.status(500).json({ message: 'Server error finding trip', error: err.message });
  }
};

/**
 * POST /api/trips
 * Creates a new trip record. Requires authentication.
 * Added: input validation to make sure required fields are present
 * before we try to write to the database.
 * @param {Object} req - Express request object with trip data in body
 * @param {Object} res - Express response object
 */
const tripsAddTrip = async (req, res) => {
  try {
    // Validate that all required fields are present
    const requiredFields = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const newTrip = new Trip({
      code: req.body.code,
      name: req.body.name,
      length: req.body.length,
      start: req.body.start,
      resort: req.body.resort,
      perPerson: req.body.perPerson,
      image: req.body.image,
      description: req.body.description
    });

    const savedTrip = await newTrip.save();

    if (!savedTrip) {
      return res.status(400).json({ message: 'Unable to add trip' });
    }

    return res.status(201).json(savedTrip);
  } catch (err) {
    // Catch duplicate key errors or validation errors from Mongoose
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A trip with that code already exists' });
    }
    return res.status(500).json({ message: 'Server error adding trip', error: err.message });
  }
};

/**
 * PUT /api/trips/:tripCode
 * Updates an existing trip by code. Requires authentication.
 * @param {Object} req - Express request object with updated data in body
 * @param {Object} res - Express response object
 */
const tripsUpdateTrip = async (req, res) => {
  try {
    const tripCode = req.params.tripCode;

    if (!tripCode) {
      return res.status(400).json({ message: 'Trip code is required for update' });
    }

    // Validate that we have at least some data to update
    const updateFields = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];
    const hasData = updateFields.some(field => req.body[field] !== undefined);

    if (!hasData) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedTrip = await Model
      .findOneAndUpdate(
        { code: tripCode },
        {
          code: req.body.code,
          name: req.body.name,
          length: req.body.length,
          start: req.body.start,
          resort: req.body.resort,
          perPerson: req.body.perPerson,
          image: req.body.image,
          description: req.body.description
        },
        { new: true } // Return the updated document
      )
      .exec();

    if (!updatedTrip) {
      return res.status(404).json({ message: `Trip not found with code: ${tripCode}` });
    }

    return res.status(200).json(updatedTrip);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cannot update - duplicate trip code' });
    }
    return res.status(500).json({ message: 'Server error updating trip', error: err.message });
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripsAddTrip,
  tripsUpdateTrip
};
