# Database Lab 2 - Login and To-Do List Application

A full-stack web application implementing user authentication and personal to-do list management, built for the Database Systems Lab 2 assignment at Alexandria National University.

![Node.js](https://img.shields.io/badge/Node.js-14%2B-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18.2-white?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue?logo=mysql)
![License](https://img.shields.io/badge/License-ISC-yellow)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Team Members](#team-members)

---

## 🎯 Overview

This application demonstrates fundamental web development concepts combined with database integration:

- **User Authentication**: Secure registration and login with session management
- **Private To-Do Lists**: Each user has their own isolated to-do items
- **CRUD Operations**: Create, read, update, and delete to-do items
- **Security Best Practices**: Password hashing, SQL injection prevention, and user isolation
- **Responsive Design**: Modern, mobile-friendly UI with glassmorphism effects

**Key Learning Objectives:**
- Session management in web applications
- Secure password storage with bcrypt
- Parameterized SQL queries to prevent injection
- Building responsive, accessible user interfaces
- Separating concerns between frontend and backend

---

## ✨ Features

### Authentication
- ✅ User registration with validation
- ✅ Secure login with session management
- ✅ Automatic logout functionality
- ✅ Password hashing with bcrypt (cost factor 10)

### To-Do Management
- ✅ Add new to-do items
- ✅ Edit to-do titles
- ✅ Toggle completion status
- ✅ Delete to-do items with confirmation
- ✅ Real-time AJAX updates (no page reload)
- ✅ User isolation (private lists)

### Security
- ✅ SQL injection prevention (prepared statements)
- ✅ Password hashing (bcrypt)
- ✅ Session-based authentication
- ✅ User data isolation
- ✅ Input validation (client & server-side)

### User Experience
- ✅ Responsive design (mobile-friendly)
- ✅ Real-time validation feedback
- ✅ Smooth animations and transitions
- ✅ Glassmorphism UI design
- ✅ Accessible error messages

---

## 🛠 Technology Stack

### Backend
- **Node.js** (v14+) - JavaScript runtime
- **Express.js** - Web framework
- **express-session** - Session middleware
- **bcryptjs** - Password hashing
- **mysql2** - MySQL client with Promise support
- **dotenv** - Environment variable management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox, Grid, and animations
- **Vanilla JavaScript (ES6+)** - Client-side logic with Fetch API

### Database
- **MySQL 8.0+** - Relational database
- **Plain SQL** - Direct queries with prepared statements
- **Foreign Key Constraints** - Referential integrity

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server (8.0 or compatible)
- Git (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-app-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   ⚠️ **Warning**: This will drop and recreate the `registration` database, deleting any existing data.

4. **Configure environment variables**
   ```bash
   # Copy the example file
   copy .env.example .env  # Windows
   # or
   cp .env.example .env    # Mac/Linux
   ```

   Edit `.env` with your credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=registration
   SESSION_SECRET=generate-a-random-secret-string
   PORT=3000
   ```

   Generate a secure SESSION_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser at `http://localhost:3000`

---

## 📁 Project Structure

```
todo-app-main/
├── database/
│   └── schema.sql          # Database schema (DDL)
├── docs/
│   ├── README.md           # Additional documentation
│   ├── api.md              # API documentation
│   ├── security.md         # Security details
│   └── database.md         # Database schema details
├── public/
│   ├── register.html       # Registration page
│   ├── register.js         # Registration logic
│   ├── login.html          # Login page
│   ├── login.js            # Login logic
│   ├── list.html           # To-do list page
│   ├── list.js             # To-do CRUD operations
│   └── styles.css          # Global styles
├── Screenshots/            # Application screenshots
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── server.js               # Express server and routes
└── README.md               # This file
```

---

## 📚 Documentation

For detailed technical documentation, see the `docs/` folder:

- **[API Documentation](docs/api.md)** - Complete API endpoint reference
- **[Security Details](docs/security.md)** - Security implementation and best practices
- **[Database Schema](docs/database.md)** - Database structure and relationships
- **[Features Implementation](docs/features.md)** - Detailed feature breakdown (R1-R10)
- **[Lab Questions](docs/questions.md)** - Lab assignment Q&A

---

## 👥 Team Members

| Name | Student ID | Contribution |
|------|------------|--------------|
| Amr Khaled Anwar | 2304037 | Backend routes, authentication, database setup, SQL queries, frontend functionality, input validation, testing, README documentation |
| Yehia Helaly | 2304048 | Feature implementation and review, authentication, to-do operations, frontend behavior, database integration, validation, testing |

Both team members contributed to the project development and testing.

---

## 📝 License

ISC

---

**Last Updated:** October 12, 2026
**Version:** 1.0.0
