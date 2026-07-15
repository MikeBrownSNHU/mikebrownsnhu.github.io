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
| Algorithms & Data Structures | 🚧 In Progress |
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
