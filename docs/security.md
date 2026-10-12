# Security Documentation

Detailed explanation of security features and best practices implemented in the To-Do List Application.

---

## Overview

This application implements multiple layers of security to protect user data and prevent common web vulnerabilities.

---

## Password Security

### Hashing Algorithm
- **Library**: bcryptjs
- **Cost Factor**: 10
- **Algorithm**: bcrypt (Blowfish-based)

### Implementation
```javascript
const bcrypt = require('bcryptjs');

// Hash password during registration
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Verify password during login
const isMatch = await bcrypt.compare(password, user.password_hash);
```

### Why bcrypt?

1. **One-Way Function**: Cannot reverse the hash to obtain the original password
2. **Automatic Salting**: Each password gets a unique random salt
3. **Slow by Design**: Cost factor makes brute-force attacks computationally expensive
4. **Industry Standard**: Widely recommended for password storage
5. **Rainbow Table Resistance**: Salt prevents pre-computed hash attacks

### Security Benefits

- **Database Breach Protection**: If the database is compromised, attackers only get hashes
- **Password Reuse Protection**: Even if users reuse passwords, the hashes are different
- **Defense in Depth**: Multiple layers of protection even if other controls fail

---

## SQL Injection Prevention

### Method: Prepared Statements

All database queries use prepared statements with parameterized queries.

### Implementation
```javascript
// Vulnerable (NOT USED):
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Secure (USED):
const query = 'SELECT * FROM users WHERE email = ?';
const [rows] = await pool.execute(query, [email]);
```

### Why This Works

1. **Separation of Data and Code**: Parameters are treated as data, not executable code
2. **Automatic Escaping**: mysql2 library handles proper escaping
3. **Query Plan Caching**: Database can cache query plans for better performance
4. **Type Safety**: Parameters are bound with proper types

### Coverage

All SQL queries in the application use prepared statements:
- User registration
- User login
- To-do CRUD operations
- All SELECT, INSERT, UPDATE, DELETE queries

---

## Session Security

### Session Management

- **Library**: express-session
- **Storage**: Memory store (development only)
- **Secret**: Configured via SESSION_SECRET environment variable

### Implementation
```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Security Features

1. **Signed Cookies**: Session ID is cryptographically signed
2. **HTTP Only**: Cookies not accessible via JavaScript (prevents XSS cookie theft)
3. **Session Destruction**: Properly destroyed on logout
4. **User ID Storage**: Only user_id stored in session, never sensitive data

### Production Recommendations

For production deployment:
- Use Redis or similar for session storage
- Enable `secure: true` for cookies (HTTPS only)
- Implement session rotation
- Add CSRF protection
- Set appropriate `sameSite` cookie attribute

---

## Authorization & User Isolation

### Middleware Protection

Two middleware functions protect routes:

#### requireAuth
Protects routes that require login:
```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}
```

#### requireGuest
Redirects logged-in users from auth pages:
```javascript
function requireGuest(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/list');
  }
  next();
}
```

### User Isolation

All to-do queries include the user's ID from the session:

```sql
-- Get to-dos
SELECT * FROM todos WHERE user_id = ?

-- Update to-do
UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?

-- Delete to-do
DELETE FROM todos WHERE todo_id = ? AND user_id = ?
```

### Why This Matters

1. **Prevents Horizontal Privilege Escalation**: Users cannot access other users' data
2. **Session-Based Identification**: user_id from session, not from form data
3. **Defense in Depth**: Even if todo_id is manipulated, user_id check prevents access
4. **Referential Integrity**: Foreign key constraints enforce database-level protection

---

## Input Validation

### Client-Side Validation

JavaScript validation before form submission:
- Required field checks
- Password confirmation matching
- Length validation
- Empty string detection

### Server-Side Validation

Backend validation as the final defense:
- All required fields checked
- Duplicate email detection
- Password confirmation verification
- Title length validation (max 200 characters)
- Whitespace-only string detection

### Error Messages

Specific, user-friendly error messages:
- No stack traces exposed
- No raw database errors
- Clear guidance on what went wrong

---

## User Enumeration Prevention

### Unified Error Messages

Both wrong email and wrong password return the same message:
- "Invalid email or password"

This prevents attackers from:
- Determining which email addresses are registered
- Targeting specific accounts
- Building user lists for attacks

---

## CSRF Protection

### Current Status

CSRF tokens are not implemented in this coursework project.

### Production Recommendation

Before public deployment, implement CSRF protection:
- Use libraries like `csurf` or built-in Express CSRF middleware
- Include CSRF tokens in all state-changing forms
- Validate tokens on the server
- Configure cookie security settings (sameSite attribute)

---

## Data Integrity

### Database Constraints

1. **NOT NULL**: Prevents NULL values in critical fields
2. **UNIQUE**: Ensures email addresses are unique
3. **FOREIGN KEY**: Enforces referential integrity between users and todos
4. **Data Types**: Appropriate types for all fields (VARCHAR, INT, TIMESTAMP, TINYINT)

### Application-Level Validation

Complements database constraints:
- Better user experience
- Specific error messages
- Pre-validation before database hit
- Fallback if database constraints fail

---

## Security Checklist

✅ Passwords hashed with bcrypt (cost factor 10)
✅ Prepared statements for all SQL queries
✅ Session-based authentication
✅ User isolation in all to-do operations
✅ Input validation (client and server-side)
✅ Unified error messages to prevent enumeration
✅ HTTP-only session cookies
✅ Signed session cookies
✅ Proper session destruction on logout
✅ No raw database errors exposed to users
✅ No stack traces exposed to users
✅ Environment variables for sensitive data
✅ .env in .gitignore

---

## Production Deployment Checklist

For production deployment, additional security measures are needed:

⬜ Use Redis or similar for session storage
⬜ Enable HTTPS with valid SSL certificate
⬜ Set `secure: true` for cookies
⬜ Implement CSRF protection
⬜ Set `sameSite` cookie attribute
⬜ Implement rate limiting
⬜ Add request logging and monitoring
⬜ Implement CORS policies if needed
⬜ Use Helmet.js for security headers
⬜ Regular security updates for dependencies
⬜ Implement backup and recovery procedures
⬜ Add logging for authentication attempts
⬜ Implement account lockout after failed attempts

---

## Security Best Practices Summary

1. **Never trust user input** - Always validate and sanitize
2. **Use parameterized queries** - Prevent SQL injection
3. **Hash passwords** - Never store plain text passwords
4. **Use HTTPS in production** - Encrypt all data in transit
5. **Implement proper session management** - Secure cookie settings
6. **Principle of least privilege** - Users only access their own data
7. **Defense in depth** - Multiple layers of security
8. **Keep dependencies updated** - Patch known vulnerabilities
9. **Log security events** - Monitor for suspicious activity
10. **Regular security audits** - Review and test security measures
