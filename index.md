# Mike Brown

## Computer Science ePortfolio

Welcome to my academic ePortfolio for the Bachelor of Science in Computer Science program at Southern New Hampshire University.

This site showcases projects completed throughout my degree program and documents the enhancements made during my CS 499 Capstone. Throughout the program, I have focused on applying what I learned in the classroom to real engineering challenges while working full time as an Engineering Manager.

> **Note:** This GitHub Pages site serves as my academic ePortfolio for CS 499. My professional portfolio, virtual résumé, and additional engineering projects can be found at **https://devmbrown.com**.

---

# Featured Capstone Project

## CS 499 Computer Science Capstone

### Enhancing the CS 465 Full Stack Travel Application

For my capstone project, I selected my Full Stack Travel Application that was originally developed during CS 465. The application uses the MEAN stack (MongoDB, Express, Angular, Node.js) and includes a customer-facing travel site and an administrative SPA for managing trip data.

Throughout the capstone, I enhanced the application in three major areas:

- Software Engineering and Design
- Algorithms and Data Structures
- Database Design and Optimization

These enhancements transform the original course project into a more complete and production-ready application while demonstrating the skills developed throughout my Computer Science degree.

---

# CS 499 Enhancement Progress

| Enhancement | Status |
|-------------|:------:|
| Software Engineering & Design | ✅ Complete |
| Algorithms & Data Structures | ✅ Complete |
| Database Design | 🚧 In Progress |

---

# Enhancement One: Software Engineering & Design

For this enhancement, I focused on restructuring the application to improve maintainability, security, and code quality. Key improvements included:

- Fixed a critical JWT authentication bug where the middleware never actually blocked unauthorized requests
- Added role-based access control so only admin users can create or modify trips
- Increased password hashing strength from 1,000 to 210,000 PBKDF2 iterations (per OWASP guidelines)
- Added proper error handling (try/catch) to all API controllers that previously had none
- Created a shared Angular form component to eliminate duplicate templates between add-trip and edit-trip
- Fixed a race condition in the login component that relied on a setTimeout timer instead of proper async handling
- Added input validation on all API endpoints before database writes
- Integrated helmet for HTTP security headers
- Added JSDoc documentation throughout the codebase

These changes address Course Outcomes 2 (professional communication), 4 (software engineering techniques), and 5 (security-focused development).

---

# Enhancement Two: Algorithms & Data Structures

For this enhancement, I focused on replacing the naive data access pattern with efficient, scalable query operations that leverage proper data structures. The original API loaded every document on every request with no way to search, filter, sort, or paginate.

Key improvements included:

- Added full-text search using a compound text index (inverted index data structure) on trip name and description with weighted relevance scoring
- Implemented B-tree indexed filtering for resort name, price range, and trip length — enabling O(log n) lookups instead of O(n) collection scans
- Added server-side sorting with field and direction parameters, validated against an allowlist to prevent injection
- Implemented cursor-based pagination with a response envelope containing metadata (total count, current page, total pages, page size)
- Built an aggregation pipeline using $facet to produce trip statistics in a single collection scan: overall averages, per-resort breakdown, price distribution histogram, and upcoming trips
- Created a performance benchmarking endpoint that times original vs. enhanced approaches with Big-O complexity analysis
- Used a query builder pattern with pure helper functions for filter construction, sort parsing, and pagination validation
- Added security measures: regex character escaping (ReDoS prevention), bounded page sizes (memory exhaustion prevention), and allowlisted sort fields (injection prevention)

These changes address Course Outcome 3 (algorithmic principles and design trade-offs), with continued coverage of Outcomes 4 (innovative techniques and tools) and 5 (security mindset).

---

# Code Review

As part of the capstone process, I conducted a thorough code review of the original artifact before beginning enhancements. The review identified security vulnerabilities, algorithmic inefficiencies, and database design flaws that guided my enhancement plan across all three categories.

### Category One: Software Design and Engineering

[![Code Review - Software Design and Engineering](https://img.youtube.com/vi/Of6VZ2yBVEA/0.jpg)](https://youtu.be/Of6VZ2yBVEA)

[Watch on YouTube](https://youtu.be/Of6VZ2yBVEA)

### Category Two: Algorithms and Data Structures

[![Code Review - Algorithms and Data Structures](https://img.youtube.com/vi/MgQl8DuVn2A/0.jpg)](https://youtu.be/MgQl8DuVn2A)

[Watch on YouTube](https://youtu.be/MgQl8DuVn2A)

### Category Three: Databases

[![Code Review - Databases](https://img.youtube.com/vi/3mITZRAcLKw/0.jpg)](https://youtu.be/3mITZRAcLKw)

[Watch on YouTube](https://youtu.be/3mITZRAcLKw)

---

# Featured Project

## CS 465 – Full Stack Travel Application

**Technologies**

- Angular
- Node.js
- Express
- MongoDB

**Repository**

https://github.com/MikeBrownSNHU/CS-465/tree/module7

---

# Coursework

This portfolio represents work completed throughout my Computer Science degree, including projects involving:

- Full Stack Web Development
- Embedded Systems
- Software Engineering
- Algorithms and Data Structures
- Database Design
- Secure Coding
- Software Testing
- System Architecture

---

# About Me

I currently work as an Engineering Manager where I lead engineering and automation projects supporting manufacturing operations. My professional experience has given me the opportunity to solve real-world engineering problems while leading technical teams and implementing automation solutions.

Through my Computer Science degree, I have expanded those skills into software engineering, full-stack web development, database design, and secure application development. My goal is to continue building software that improves engineering processes and delivers practical solutions to real business challenges.

---

# Connect With Me

### GitHub

https://github.com/MikeBrownSNHU

### LinkedIn

https://www.linkedin.com/in/mike-brown-68a9589a/

### Professional Portfolio & Virtual Résumé

https://devmbrown.com/

### Email

mike@devmbrown.com

---

**Southern New Hampshire University**
Academic ePortfolio for CS 499
