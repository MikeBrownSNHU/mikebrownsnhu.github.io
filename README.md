# Travlr Getaways — Enhancement Two: Algorithms & Data Structures

This branch contains my second capstone enhancement for CS 499. Building on the software engineering improvements from Enhancement One, I focused on implementing efficient search, filtering, sorting, pagination, and data aggregation to demonstrate skills in algorithms and data structures.

## What This Project Is

Travlr Getaways is a full-stack travel booking application built with the MEAN stack (MongoDB, Express, Angular, Node.js). It has a customer-facing site rendered with Handlebars and an Angular admin SPA where administrators can manage trip listings. Authentication uses JWT tokens.

## What I Changed and Why

During my code review in Module 2, I identified that the original API loaded every document from the database on every request — a single `Model.find({})` with no filtering, sorting, pagination, or search capability. This is an O(n) approach that doesn't scale. Enhancement Two replaces this with an efficient query pipeline that leverages proper data structures.

### Full-Text Search (Inverted Index)

Added a compound text index on the trip name and description fields with weighted scoring (name matches weighted 3x over description). MongoDB's text index uses an inverted index data structure — a hash map where each tokenized word maps to the documents containing it — enabling O(1) per-term lookups regardless of collection size.

```
GET /api/trips?search=reef
```

### Filtering with B-Tree Indexes

Added indexes on resort and perPerson fields to support efficient range queries and equality filters. MongoDB uses B-tree indexes that enable binary search (O(log n)) instead of sequential scans (O(n)). Filters can be combined:

```
GET /api/trips?resort=Emerald&minPrice=500&maxPrice=2000&minLength=3
```

### Server-Side Sorting

Accepts a sort field and direction, validated against an allowlist of permitted fields to prevent injection. When text search is active without explicit sort, results are automatically ranked by relevance score.

```
GET /api/trips?sort=perPerson&order=asc
```

### Pagination

Implements page/limit pagination using MongoDB's skip and limit operators. Returns a response envelope with metadata. Bounds memory usage to O(k) where k is the page size instead of O(n) for the full collection.

```
GET /api/trips?page=2&limit=5
```

Response format:
```json
{
  "data": [...],
  "meta": { "total": 20, "page": 2, "pages": 4, "limit": 5 }
}
```

### Aggregation Pipeline (Stats Endpoint)

Added `/api/trips/stats` using MongoDB's aggregation framework with `$facet` to run four parallel sub-pipelines in a single collection scan:
- Overall statistics (average price, min/max, total count)
- Per-resort breakdown (group by resort with counts and averages)
- Price distribution histogram ($bucket with configurable boundaries)
- Upcoming trips (date range match + sort + limit)

### Performance Benchmarking

Added `/api/trips/performance` which times the original find-all approach alongside the enhanced paginated query, text search, and aggregation pipeline. Reports execution times in milliseconds with Big-O complexity analysis for each approach.

### Security Considerations

- Regex special characters are escaped in filter inputs to prevent ReDoS attacks
- Sort field names are validated against an allowlist to prevent arbitrary property access
- Page size is bounded (max 100) to prevent memory exhaustion
- All user input is sanitized before use in query construction

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trips | List trips with search, filter, sort, pagination |
| GET | /api/trips/stats | Aggregated statistics and analytics |
| GET | /api/trips/performance | Performance benchmarks comparison |
| GET | /api/trips/:tripCode | Single trip by code |
| POST | /api/trips | Create trip (admin auth required) |
| PUT | /api/trips/:tripCode | Update trip (admin auth required) |

## How to Run

```bash
# Install backend dependencies
npm install

# Start the Express server (port 3000)
npm start

# In a separate terminal, run the Angular admin app
cd app_admin
npm install
npx ng serve
# Admin app runs on localhost:4200
```

You'll need MongoDB running locally and a `.env` file with your `JWT_SECRET` and `MONGODB_URI` set.

## What's Next

- Enhancement Three (Databases) — adding MongoDB schema validation, advanced indexing strategies, data integrity constraints, and a reporting dashboard
