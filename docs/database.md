# Database Schema Documentation

Complete reference for the database structure, relationships, and queries used in the To-Do List Application.

---

## Overview

The application uses MySQL 8.0+ with two main tables: `users` and `todos`. The database name is `registration`.

---

## Database Schema

### users Table

Stores user account information including authentication credentials.

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Descriptions:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique identifier for each user |
| name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address (login identifier) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash of the user's password |
| registration_date | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the user account was created |

**Indexes:**
- PRIMARY KEY on `user_id`
- UNIQUE index on `email`

---

### todos Table

Stores to-do items associated with users.

```sql
CREATE TABLE todos (
    todo_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    is_done TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

**Column Descriptions:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| todo_id | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique identifier for each to-do |
| user_id | INT | NOT NULL, FOREIGN KEY | References the user who owns this to-do |
| title | VARCHAR(200) | NOT NULL | The to-do item text/title |
| is_done | TINYINT(1) | NOT NULL, DEFAULT 0 | Completion status (0 = not done, 1 = done) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the to-do was created |

**Indexes:**
- PRIMARY KEY on `todo_id`
- FOREIGN KEY on `user_id` referencing `users(user_id)`

---

## Relationships

### One-to-Many Relationship

One user can have many to-do items.

```
users (1) ----< (many) todos
```

**Foreign Key Constraint:**
```sql
FOREIGN KEY (user_id) REFERENCES users(user_id)
```

**Constraints Enforced:**
- **Referential Integrity**: Cannot insert a to-do for a non-existent user
- **Cascade Behavior**: Not explicitly set (default is RESTRICT)
  - Cannot delete a user if they have to-dos
  - Must delete to-dos first before deleting user

---

## SQL Queries Used

### Registration

#### Insert New User
```sql
INSERT INTO users (name, email, password_hash)
VALUES (?, ?, ?)
```

**Parameters:**
1. name (from form)
2. email (from form)
3. password_hash (bcrypt hashed)

#### Check for Duplicate Email
```sql
SELECT user_id FROM users WHERE email = ?
```

**Parameters:**
1. email (from form)

---

### Login

#### Authenticate User
```sql
SELECT user_id, name, email, password_hash
FROM users
WHERE email = ?
```

**Parameters:**
1. email (from form)

---

### To-Do Operations

#### Get User's To-Dos
```sql
SELECT todo_id, title, is_done, created_at
FROM todos
WHERE user_id = ?
ORDER BY todo_id DESC
```

**Parameters:**
1. user_id (from session)

**Ordering:** DESC shows newest to-dos first

---

#### Add New To-Do
```sql
INSERT INTO todos (user_id, title)
VALUES (?, ?)
```

**Parameters:**
1. user_id (from session)
2. title (from form)

---

#### Update To-Do Title
```sql
UPDATE todos
SET title = ?
WHERE todo_id = ? AND user_id = ?
```

**Parameters:**
1. title (from form)
2. todo_id (from URL/params)
3. user_id (from session)

**Security Note:** `AND user_id = ?` ensures users can only update their own to-dos

---

#### Toggle To-Do Completion
```sql
UPDATE todos
SET is_done = ?
WHERE todo_id = ? AND user_id = ?
```

**Parameters:**
1. is_done (0 or 1, from form)
2. todo_id (from URL/params)
3. user_id (from session)

---

#### Delete To-Do
```sql
DELETE FROM todos
WHERE todo_id = ? AND user_id = ?
```

**Parameters:**
1. todo_id (from URL/params)
2. user_id (from session)

**Security Note:** `AND user_id = ?` ensures users can only delete their own to-dos

---

## Sample Data

### Users Table Example

| user_id | name | email | password_hash | registration_date |
|---------|------|-------|---------------|-------------------|
| 1 | Sara Ahmed | sara@mail.com | $2b$12$... | 2026-10-11 10:00:00 |
| 2 | Omar Ali | omar@mail.com | $2b$12$... | 2026-10-11 11:30:00 |

**Note:** `password_hash` values are truncated for display. Actual hashes are 60 characters long.

---

### To-Dos Table Example

| todo_id | user_id | title | is_done | created_at |
|---------|---------|-------|---------|------------|
| 1 | 1 | Buy oat milk | 1 | 2026-10-11 10:05:00 |
| 2 | 1 | Finish the lab | 0 | 2026-10-11 10:10:00 |
| 3 | 2 | Call mum | 0 | 2026-10-11 11:35:00 |
| 4 | 2 | Submit assignment | 1 | 2026-10-11 12:00:00 |

---

## Database Constraints Explained

### NOT NULL

**Purpose:** Prevents NULL values from being stored

**Applied to:**
- users: user_id, name, email, password_hash, registration_date
- todos: todo_id, user_id, title, is_done, created_at

**Why:** Ensures all critical fields have values

---

### UNIQUE

**Purpose:** Ensures no duplicate values in a column

**Applied to:**
- users.email

**Why:** Each email can only be registered once (prevents duplicate accounts)

---

### PRIMARY KEY

**Purpose:** Unique identifier for each row

**Applied to:**
- users.user_id
- todos.todo_id

**Why:** Enables efficient lookups and establishes relationships

---

### FOREIGN KEY

**Purpose:** Enforces referential integrity between tables

**Applied to:**
- todos.user_id REFERENCES users(user_id)

**Why:**
- Cannot insert to-do for non-existent user
- Ensures data consistency
- Maintains relationship integrity

---

### AUTO_INCREMENT

**Purpose:** Automatically generates unique sequential IDs

**Applied to:**
- users.user_id
- todos.todo_id

**Why:** Simplifies ID management, guarantees uniqueness

---

### DEFAULT

**Purpose:** Provides default values for columns

**Applied to:**
- users.registration_date: CURRENT_TIMESTAMP
- todos.is_done: 0
- todos.created_at: CURRENT_TIMESTAMP

**Why:**
- Automatic timestamp tracking
- Default completion status (not done)
- Reduces manual data entry

---

## Data Types

### VARCHAR(n)

**Used for:** Variable-length strings

**Examples:**
- name VARCHAR(100) - Names up to 100 characters
- email VARCHAR(255) - Email addresses up to 255 characters
- title VARCHAR(200) - To-do titles up to 200 characters

**Why:** Efficient storage for variable-length text

---

### INT

**Used for:** Integer numbers

**Examples:**
- user_id INT - User identifier
- todo_id INT - To-do identifier

**Why:** Efficient storage for numeric IDs

---

### TINYINT(1)

**Used for:** Boolean-like values

**Examples:**
- is_done TINYINT(1) - 0 or 1

**Why:** Efficient storage for binary states

---

### TIMESTAMP

**Used for:** Date and time values

**Examples:**
- registration_date TIMESTAMP - Account creation time
- created_at TIMESTAMP - To-do creation time

**Why:** Automatic timestamp management, timezone aware

---

## Database Setup

### Create Database

```sql
DROP DATABASE IF EXISTS registration;
CREATE DATABASE registration;
USE registration;
```

⚠️ **Warning:** `DROP DATABASE IF EXISTS` will delete all existing data. Use only for fresh setup.

---

### Complete Schema Script

See `database/schema.sql` for the complete DDL script.

To execute:
```bash
mysql -u root -p < database/schema.sql
```

---

## Maintenance Queries

### View All Users
```sql
SELECT user_id, name, email, registration_date
FROM users;
```

### View All To-Dos with User Names
```sql
SELECT t.todo_id, t.title, t.is_done, t.created_at, u.name
FROM todos t
JOIN users u ON t.user_id = u.user_id
ORDER BY t.created_at DESC;
```

### Count To-Dos per User
```sql
SELECT u.name, COUNT(t.todo_id) as todo_count
FROM users u
LEFT JOIN todos t ON u.user_id = t.user_id
GROUP BY u.user_id, u.name;
```

### Delete All To-Dos for a User
```sql
DELETE FROM todos WHERE user_id = ?;
```

### Delete a User (requires deleting to-dos first)
```sql
DELETE FROM todos WHERE user_id = ?;
DELETE FROM users WHERE user_id = ?;
```

---

## Performance Considerations

### Indexes

**Existing Indexes:**
- PRIMARY KEY on users.user_id
- UNIQUE index on users.email
- PRIMARY KEY on todos.todo_id
- FOREIGN KEY index on todos.user_id (automatic)

**Recommended Additional Indexes (for larger datasets):**
- Index on todos.user_id (already exists via FK)
- Index on todos.created_at (for time-based queries)
- Composite index on (user_id, is_done) for filtering

---

### Query Optimization

**Current queries are efficient for:**
- Small to medium datasets (< 10,000 rows)
- Single-user operations
- Simple CRUD operations

**For larger datasets, consider:**
- Pagination for to-do lists
- Caching frequently accessed data
- Read replicas for read-heavy workloads
- Connection pooling (already using mysql2 pool)

---

## Backup and Recovery

### Backup Database
```bash
mysqldump -u root -p registration > backup.sql
```

### Restore Database
```bash
mysql -u root -p registration < backup.sql
```

### Backup Specific Tables
```bash
mysqldump -u root -p registration users > users_backup.sql
mysqldump -u root -p registration todos > todos_backup.sql
```

---

## Troubleshooting

### Foreign Key Constraint Errors

**Error:** Cannot add or update a child row: a foreign key constraint fails

**Causes:**
1. Trying to insert to-do for non-existent user
2. Trying to delete user with existing to-dos

**Solutions:**
1. Ensure user exists before inserting to-do
2. Delete to-dos before deleting user, or add ON DELETE CASCADE

---

### Duplicate Entry Errors

**Error:** Duplicate entry 'email@example.com' for key 'email'

**Cause:** Trying to register with an email that already exists

**Solution:** Check if email exists before registration, or catch and display error

---

### Connection Errors

**Error:** Access denied for user 'root'@'localhost'

**Causes:**
1. Wrong password in .env
2. MySQL server not running
3. User doesn't have privileges

**Solutions:**
1. Verify .env credentials
2. Start MySQL server
3. Grant necessary privileges

---

## Security Notes

1. **Never store plain text passwords** - Always use bcrypt
2. **Use prepared statements** - Prevent SQL injection
3. **Limit privileges** - Application user should only have necessary permissions
4. **Encrypt connections** - Use SSL/TLS in production
5. **Regular backups** - Protect against data loss
6. **Monitor access logs** - Detect suspicious activity
