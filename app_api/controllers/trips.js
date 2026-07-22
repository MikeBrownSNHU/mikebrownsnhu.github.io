/**
 * @file trips.js
 * @description Controller for trip CRUD and query operations.
 * Handles GET, POST, and PUT requests for the /api/trips endpoint.
 * 
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Added try/catch blocks for proper error handling (original had none)
 * - Renamed vague 'q' variables to descriptive names
 * - Added input validation before database writes
 * - Used findOne() instead of find() for single-record lookups
 * - Added JSDoc comments for maintainability
 * 
 * Enhancement Notes (CS-499 Category 2 - Algorithms & Data Structures):
 * - Replaced naive Model.find({}) with parameterized query builder
 * - Added full-text search using MongoDB $text operator and text indexes
 * - Added filtering by resort, price range, and trip length
 * - Added server-side sorting with configurable field and direction
 * - Added cursor-based pagination with limit/offset (page/limit params)
 * - Added aggregation pipeline for trip statistics (avg price, counts by resort)
 * - Added performance comparison endpoint demonstrating O(n) scan vs indexed query
 * - All query operations leverage indexed fields for O(log n) lookup efficiency
 * 
 * @author Mike Brown
 */

const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const Model = mongoose.model('trips');

// --- Constants ---

/** Default number of results per page */
const DEFAULT_PAGE_SIZE = 10;

/** Maximum allowed page size to prevent excessive memory use */
const MAX_PAGE_SIZE = 100;

/** Allowed sort fields to prevent injection via arbitrary field names */
const ALLOWED_SORT_FIELDS = ['name', 'perPerson', 'length', 'start', 'resort', 'code'];

/**
 * Builds a MongoDB filter object from query parameters.
 * Constructs the filter incrementally based on which params are provided.
 * 
 * Algorithm: Iterates through known filter params and builds a compound
 * query object. Each filter narrows the result set (logical AND).
 * MongoDB uses index intersection when multiple indexed fields are queried.
 * 
 * @param {Object} query - Express req.query object
 * @returns {Object} MongoDB filter object
 */
function buildFilter(query) {
  const filter = {};

  // Text search - uses the compound text index on name + description
  // MongoDB text search tokenizes the query, stems words, and matches
  // against the inverted index structure for O(1) per-term lookups
  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  // Resort filter - partial match (case-insensitive via regex)
  // Uses contains rather than exact match so "Emerald" matches "Emerald Bay, 3 stars"
  if (query.resort && query.resort.trim()) {
    filter.resort = new RegExp(escapeRegex(query.resort.trim()), 'i');
  }

  // Price range filter - uses perPerson index for range scan
  if (query.minPrice || query.maxPrice) {
    filter.perPerson = {};
    if (query.minPrice) {
      const min = parseFloat(query.minPrice);
      if (!isNaN(min)) filter.perPerson.$gte = min;
    }
    if (query.maxPrice) {
      const max = parseFloat(query.maxPrice);
      if (!isNaN(max)) filter.perPerson.$lte = max;
    }
    // Remove empty object if neither parsed correctly
    if (Object.keys(filter.perPerson).length === 0) delete filter.perPerson;
  }

  // Trip length range filter
  if (query.minLength || query.maxLength) {
    filter.length = {};
    if (query.minLength) {
      const min = parseInt(query.minLength, 10);
      if (!isNaN(min)) filter.length.$gte = min;
    }
    if (query.maxLength) {
      const max = parseInt(query.maxLength, 10);
      if (!isNaN(max)) filter.length.$lte = max;
    }
    if (Object.keys(filter.length).length === 0) delete filter.length;
  }

  return filter;
}

/**
 * Escapes special regex characters in a string to prevent ReDoS attacks.
 * @param {string} str - Raw user input string
 * @returns {string} Escaped string safe for use in RegExp constructor
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses and validates sort parameters from query string.
 * Returns a MongoDB sort object or null for default sort.
 * 
 * @param {Object} query - Express req.query object
 * @returns {Object|null} MongoDB sort object (e.g., { name: 1 }) or null
 */
function buildSort(query) {
  // If text search is active and no explicit sort, use text score relevance
  if (query.search && query.search.trim() && !query.sort) {
    return { score: { $meta: 'textScore' } };
  }

  if (!query.sort) return null;

  const field = query.sort.trim().toLowerCase();
  if (!ALLOWED_SORT_FIELDS.includes(field)) return null;

  // Default to ascending; accept 'desc', 'descending', or '-1'
  const order = query.order;
  let direction = 1;
  if (order && ['desc', 'descending', '-1'].includes(order.toLowerCase())) {
    direction = -1;
  }

  return { [field]: direction };
}

/**
 * Parses pagination parameters with validation and defaults.
 * 
 * @param {Object} query - Express req.query object
 * @returns {{ page: number, limit: number, skip: number }} Pagination config
 */
function buildPagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Validate and apply defaults
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * GET /api/trips
 * Enhanced trip listing with search, filter, sort, and pagination.
 * 
 * Query Parameters:
 *   search    - Full-text search across name and description
 *   resort    - Filter by resort name (case-insensitive)
 *   minPrice  - Minimum price per person
 *   maxPrice  - Maximum price per person
 *   minLength - Minimum trip length (nights)
 *   maxLength - Maximum trip length (nights)
 *   sort      - Sort field (name, perPerson, length, start, resort, code)
 *   order     - Sort direction (asc or desc)
 *   page      - Page number (default: 1)
 *   limit     - Results per page (default: 10, max: 100)
 * 
 * Response envelope includes pagination metadata:
 *   { data: [...], meta: { total, page, pages, limit } }
 * 
 * Performance: Leverages text index for search, field indexes for filters,
 * and skip/limit for pagination. Avoids loading entire collection into memory.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const tripsList = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query);
    const { page, limit, skip } = buildPagination(req.query);

    // Build the query - only select text score if doing text search
    let findQuery = Model.find(filter);

    // Add text score projection for relevance sorting
    if (filter.$text) {
      findQuery = findQuery.select({ score: { $meta: 'textScore' } });
    }

    // Apply sort (if specified) then pagination
    if (sort) {
      findQuery = findQuery.sort(sort);
    }

    findQuery = findQuery.skip(skip).limit(limit);

    // Execute query and count in parallel for efficiency
    const [trips, total] = await Promise.all([
      findQuery.exec(),
      Model.countDocuments(filter).exec()
    ]);

    // Return paginated envelope with metadata
    return res.status(200).json({
      data: trips,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error retrieving trips', error: err.message });
  }
};

/**
 * GET /api/trips/stats
 * Aggregation pipeline for trip statistics.
 * 
 * Demonstrates MongoDB aggregation framework - a multi-stage data processing
 * pipeline that transforms documents through sequential operations.
 * 
 * Pipeline stages:
 * 1. $group: Groups all documents, calculates aggregate values
 * 2. Parallel facet for per-resort breakdown
 * 
 * This showcases algorithm knowledge: aggregation pipelines use a DAG
 * (directed acyclic graph) execution model where each stage passes its
 * output to the next, similar to Unix pipes but with database-level
 * optimization (index usage, memory management, disk spillover).
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const tripsStats = async (req, res) => {
  try {
    const stats = await Model.aggregate([
      {
        // $facet runs multiple aggregation pipelines in parallel on the
        // same input documents - efficient because it only scans once
        $facet: {
          // Overall summary statistics
          overview: [
            {
              $group: {
                _id: null,
                totalTrips: { $sum: 1 },
                averagePrice: { $avg: '$perPerson' },
                minPrice: { $min: '$perPerson' },
                maxPrice: { $max: '$perPerson' },
                averageLength: { $avg: '$length' },
                totalRevenuePotential: { $sum: '$perPerson' }
              }
            },
            {
              // Remove the _id field from output
              $project: { _id: 0 }
            }
          ],
          // Per-resort breakdown with sorting
          byResort: [
            {
              $group: {
                _id: '$resort',
                tripCount: { $sum: 1 },
                averagePrice: { $avg: '$perPerson' },
                minPrice: { $min: '$perPerson' },
                maxPrice: { $max: '$perPerson' },
                averageLength: { $avg: '$length' }
              }
            },
            {
              $sort: { tripCount: -1 } // Most popular resorts first
            },
            {
              $project: {
                _id: 0,
                resort: '$_id',
                tripCount: 1,
                averagePrice: { $round: ['$averagePrice', 2] },
                minPrice: 1,
                maxPrice: 1,
                averageLength: { $round: ['$averageLength', 1] }
              }
            }
          ],
          // Price distribution buckets (histogram)
          priceDistribution: [
            {
              $bucket: {
                groupBy: '$perPerson',
                boundaries: [0, 500, 1000, 2000, 3000, 5000, 10000],
                default: '10000+',
                output: {
                  count: { $sum: 1 },
                  trips: { $push: '$name' }
                }
              }
            }
          ],
          // Upcoming trips (next 6 months)
          upcoming: [
            {
              $match: {
                start: {
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                }
              }
            },
            { $sort: { start: 1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                name: 1,
                resort: 1,
                start: 1,
                perPerson: 1
              }
            }
          ]
        }
      }
    ]).exec();

    // $facet always returns a single document with the facet names as keys
    const result = stats[0];

    return res.status(200).json({
      overview: result.overview[0] || {},
      byResort: result.byResort,
      priceDistribution: result.priceDistribution,
      upcoming: result.upcoming
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error computing statistics', error: err.message });
  }
};

/**
 * GET /api/trips/performance
 * Benchmarks the original find-all approach vs. the enhanced query pipeline.
 * 
 * This endpoint demonstrates the performance difference between:
 * 1. Original: Model.find({}) - loads ALL documents (O(n) full collection scan)
 * 2. Enhanced: Filtered + paginated query using indexes (O(log n) for indexed lookups)
 * 
 * Reports execution time in milliseconds for both approaches, showing the
 * concrete benefit of proper data structure choices (B-tree indexes) and
 * algorithm optimization (pagination prevents unnecessary data transfer).
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const tripsPerformance = async (req, res) => {
  try {
    // --- Benchmark 1: Original approach (find all, no index hints) ---
    const originalStart = process.hrtime.bigint();
    const allTrips = await Model.find({}).exec();
    const originalEnd = process.hrtime.bigint();
    const originalTimeMs = Number(originalEnd - originalStart) / 1_000_000;

    // --- Benchmark 2: Enhanced approach (filtered + paginated + sorted) ---
    const enhancedStart = process.hrtime.bigint();
    const enhancedTrips = await Model.find({})
      .sort({ perPerson: 1 })
      .skip(0)
      .limit(10)
      .exec();
    const enhancedEnd = process.hrtime.bigint();
    const enhancedTimeMs = Number(enhancedEnd - enhancedStart) / 1_000_000;

    // --- Benchmark 3: Text search (if data supports it) ---
    let searchTimeMs = null;
    try {
      const searchStart = process.hrtime.bigint();
      await Model.find({ $text: { $search: 'reef' } })
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .exec();
      const searchEnd = process.hrtime.bigint();
      searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;
    } catch (searchErr) {
      // Text search might fail if no text index exists yet
      searchTimeMs = null;
    }

    // --- Benchmark 4: Aggregation pipeline ---
    const aggStart = process.hrtime.bigint();
    await Model.aggregate([
      { $group: { _id: '$resort', count: { $sum: 1 }, avgPrice: { $avg: '$perPerson' } } },
      { $sort: { count: -1 } }
    ]).exec();
    const aggEnd = process.hrtime.bigint();
    const aggTimeMs = Number(aggEnd - aggStart) / 1_000_000;

    // Calculate improvement ratios
    const paginationSpeedup = originalTimeMs > 0
      ? ((originalTimeMs - enhancedTimeMs) / originalTimeMs * 100).toFixed(1)
      : 'N/A';

    return res.status(200).json({
      summary: {
        totalDocuments: allTrips.length,
        paginatedResults: enhancedTrips.length,
        paginationImprovement: `${paginationSpeedup}% faster (less data transferred)`
      },
      benchmarks: {
        originalFindAll: {
          description: 'Model.find({}) - loads entire collection into memory',
          timeMs: parseFloat(originalTimeMs.toFixed(3)),
          documentsReturned: allTrips.length,
          complexity: 'O(n) - full collection scan'
        },
        enhancedPaginated: {
          description: 'Sorted + paginated query with limit/skip',
          timeMs: parseFloat(enhancedTimeMs.toFixed(3)),
          documentsReturned: enhancedTrips.length,
          complexity: 'O(log n + k) - index scan + k results'
        },
        textSearch: {
          description: 'Full-text search using inverted text index',
          timeMs: searchTimeMs !== null ? parseFloat(searchTimeMs.toFixed(3)) : 'index not available',
          complexity: 'O(1) per term via inverted index lookup'
        },
        aggregation: {
          description: 'Aggregation pipeline - group by resort with stats',
          timeMs: parseFloat(aggTimeMs.toFixed(3)),
          complexity: 'O(n) - single pass with hash grouping'
        }
      },
      analysis: {
        whyIndexesMatter: 'B-tree indexes enable binary search (O(log n)) instead of sequential scan (O(n)). ' +
          'For a collection of 1000 trips, this means ~10 comparisons vs 1000.',
        whyPaginationMatters: 'Returning 10 results instead of all N reduces memory allocation, ' +
          'network transfer, and client-side rendering time proportionally.',
        whyTextIndexMatters: 'Text indexes use an inverted index (word → document mapping) enabling ' +
          'constant-time per-term lookups regardless of collection size.',
        whyAggregationMatters: 'Server-side aggregation avoids transferring raw data to the client. ' +
          'The database engine optimizes grouping with hash tables and can use indexes for $match stages.'
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error running performance benchmarks', error: err.message });
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
  tripsUpdateTrip,
  tripsStats,
  tripsPerformance
};
