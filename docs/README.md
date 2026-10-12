# Documentation

Welcome to the documentation for the To-Do List Application. This folder contains detailed technical documentation for developers and students.

---

## 📚 Documentation Index

### [API Documentation](api.md)
Complete reference for all API endpoints including:
- Authentication endpoints (register, login, logout)
- To-do CRUD operations
- Utility endpoints
- Request/response formats
- Error handling

### [Security Documentation](security.md)
Detailed security implementation and best practices:
- Password hashing with bcrypt
- SQL injection prevention
- Session security
- Authorization and user isolation
- Input validation
- Production security checklist

### [Database Schema](database.md)
Complete database structure reference:
- Table schemas (users, todos)
- Relationships and constraints
- SQL queries used
- Sample data
- Maintenance queries
- Performance considerations

### [Features Implementation](features.md)
Detailed breakdown of all features (R1-R10):
- User registration (R1)
- User login & logout (R2)
- Private to-do lists (R3)
- Add to-do items (R4)
- Edit to-do titles (R5)
- Toggle completion status (R6)
- Delete to-do items (R7)
- Comprehensive validation (R8)
- Security implementation (R9)
- User interface design (R10)

### [Lab Questions & Answers](questions.md)
Answers to the lab assignment questions:
- Why UPDATE/DELETE contain `AND user_id = ?`
- Foreign key constraints and referential integrity
- Why store password hashes instead of plain passwords
- Why application validation is needed despite NOT NULL constraints

---

## 🚀 Quick Reference

### Database Schema
See `../database/schema.sql` for the complete DDL script.

### API Endpoints

**Authentication:**
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user

**To-Do Operations:**
- `GET /api/todos` - Get user's to-dos
- `POST /api/todos` - Add new to-do
- `PUT /api/todos/:id` - Edit to-do title
- `PATCH /api/todos/:id/toggle` - Toggle completion
- `DELETE /api/todos/:id` - Delete to-do

### Environment Variables

Required in `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=registration
SESSION_SECRET=random_secret
PORT=3000
```

### Security Features

- Passwords hashed with bcrypt (cost factor 10)
- SQL injection prevention via prepared statements
- Session-based authentication
- User isolation (AND user_id in UPDATE/DELETE)

---

## 📖 For Full Documentation

For the main project documentation, including setup instructions and overview, see the main [README.md](../README.md) in the project root.
