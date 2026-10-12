# Lab Questions & Answers

Answers to the lab assignment questions for Database Systems Lab 2.

---

## Question (a)

**Why do UPDATE and DELETE contain AND user_id = ?, and what changes if you remove it?**

### Answer

The `AND user_id = ?` clause ensures that a user can only modify or delete their own to-dos. This is a critical security measure because the `todo_id` comes from the browser (user input), which could be manipulated by an attacker.

### Why It's Needed

**Security Concern:**
- The `todo_id` is passed from the client (browser)
- A malicious user could change the `todo_id` in the request
- Without the user_id check, they could modify/delete other users' to-dos

**Example Attack Scenario:**
```
User A (user_id = 1) has todo_id = 5
User B (user_id = 2) has todo_id = 10

Without user_id check:
User B could send: DELETE /api/todos/5
Result: User A's to-do gets deleted (horizontal privilege escalation)

With user_id check:
User B sends: DELETE /api/todos/5
Query: DELETE FROM todos WHERE todo_id = 5 AND user_id = 2
Result: 0 rows affected (user_id mismatch), deletion prevented
```

### What Changes If You Remove It

**Without the user_id check:**
```sql
-- Vulnerable query
DELETE FROM todos WHERE todo_id = ?
```

**Consequences:**
1. **Horizontal Privilege Escalation**: Any user can delete any to-do by knowing the todo_id
2. **Data Loss**: Users can delete other users' data
3. **Privacy Violation**: Users can access and modify private data
4. **Trust Violation**: Users cannot trust the application to protect their data

**With the user_id check:**
```sql
-- Secure query
DELETE FROM todos WHERE todo_id = ? AND user_id = ?
```

**Consequences:**
1. **User Isolation**: Users can only affect their own data
2. **Data Protection**: Cross-user data access is prevented
3. **Trust**: Users can trust their data is private
4. **Security**: Follows principle of least privilege

### Technical Implementation

**Server Code:**
```javascript
await pool.execute(
  'DELETE FROM todos WHERE todo_id = ? AND user_id = ?',
  [todoId, req.session.userId]  // user_id from session, not form
);
```

**Key Points:**
- `user_id` comes from the session (server-side)
- Cannot be manipulated by the user
- Session is created during login with verified credentials
- Provides defense in depth against ID manipulation

---

## Question (b)

**What happens if you insert a to-do for a user_id that does not exist, and which constraint of the lecture is that?**

### Answer

If you try to insert a to-do with a `user_id` that doesn't exist in the `users` table, the database will reject the insertion due to the **foreign key constraint**.

### Database Behavior

**Attempted Insert:**
```sql
INSERT INTO todos (user_id, title, is_done)
VALUES (999, 'Test to-do', 0);
-- Where user_id = 999 does not exist in users table
```

**Result:**
```
ERROR 1452 (23000): Cannot add or update a child row:
a foreign key constraint fails
(`registration`.`todos`, CONSTRAINT `todos_ibfk_1`
FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`))
```

### Referential Integrity Constraint

This is the **referential integrity constraint** from the lecture.

**Definition:**
Referential integrity ensures that relationships between tables remain consistent. A foreign key value must either:
- Be NULL
- Match an existing primary key value in the referenced table

**In This Application:**
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

**The Foreign Key Constraint:**
```sql
FOREIGN KEY (user_id) REFERENCES users(user_id)
```

### Why This Constraint Exists

**Data Integrity:**
- Prevents orphaned records (to-dos without valid users)
- Ensures every to-do belongs to a real user
- Maintains logical consistency in the database

**Application Reliability:**
- Prevents application errors when querying to-dos
- Ensures JOIN operations always work
- Maintains trust in data relationships

**Security:**
- Prevents creation of to-dos for non-existent users
- Ensures data can only be created for valid accounts
- Supports user isolation

### Cascade Behavior

**Current Implementation:**
- No explicit CASCADE rules set
- Default behavior: RESTRICT
- Cannot delete a user if they have to-dos

**To Delete a User:**
```sql
-- Must delete to-dos first
DELETE FROM todos WHERE user_id = 1;
-- Then delete user
DELETE FROM users WHERE user_id = 1;
```

**Alternative with CASCADE:**
```sql
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE CASCADE
```

This would automatically delete all to-dos when a user is deleted (not used in this application).

### Practical Example

**Valid Insert:**
```sql
-- User exists
INSERT INTO users (name, email, password_hash)
VALUES ('John', 'john@mail.com', '$2b$12$...');
-- user_id = 1 created

-- To-do insert succeeds
INSERT INTO todos (user_id, title, is_done)
VALUES (1, 'Buy milk', 0);
-- Success: user_id = 1 exists
```

**Invalid Insert:**
```sql
-- User does not exist
INSERT INTO todos (user_id, title, is_done)
VALUES (999, 'Buy milk', 0);
-- Error: user_id = 999 does not exist in users table
```

### Application Protection

**The application code prevents this:**
```javascript
// user_id comes from session, not form
await pool.execute(
  'INSERT INTO todos (user_id, title) VALUES (?, ?)',
  [req.session.userId, title]  // Session guarantees user exists
);
```

**Defense in Depth:**
1. Application logic ensures user exists (from session)
2. Database constraint enforces referential integrity
3. Even if application logic fails, database protects data

---

## Question (c)

**Why do you store a hash and not the password?**

### Answer

We store a hash instead of the plain password for security reasons. If the database is compromised, attackers would only get the hashed values, not the actual passwords. Hashing is a one-way function, so it's computationally infeasible to reverse the hash to obtain the original password.

### Security Risks of Storing Plain Passwords

**If passwords are stored in plain text:**

1. **Database Breach Exposure**
   - All user passwords immediately visible
   - Attackers can use passwords immediately
   - No time to warn users or rotate credentials

2. **Password Reuse Impact**
   - Users often reuse passwords across sites
   - One breach compromises multiple accounts
   - Banking, email, social media all at risk

3. **No Recovery Possible**
   - Once exposed, passwords are compromised forever
   - Cannot "un-expose" a password
   - Users must change all affected passwords

4. **Liability and Trust**
   - Legal and regulatory violations (GDPR, etc.)
   - Loss of user trust
   - Reputation damage

### How Hashing Works

**Hashing Process:**
```
Plain Password: "password123"
                  ↓
              Hash Function (bcrypt)
                  ↓
Hashed Value: "$2b$12$abcdefghijklmnopqrstuv..."
```

**Key Properties:**
- **One-way**: Cannot reverse hash to get original password
- **Deterministic**: Same input always produces same hash
- **Avalanche Effect**: Small input change = completely different hash
- **Fixed Length**: Output always same length regardless of input

### Why bcrypt?

**bcrypt Features:**

1. **Automatic Salting**
   ```
   Password: "password123"
   Salt 1: "abc123" → Hash: "$2b$12$abc123..."
   Salt 2: "xyz789" → Hash: "$2b$12$xyz789..."
   ```
   - Each password gets unique random salt
   - Prevents rainbow table attacks
   - Same password has different hashes each time

2. **Slow by Design**
   - Cost factor (10) makes it computationally expensive
   - Slows down brute-force attacks
   - Adjustable for future hardware improvements

3. **Battle-Tested**
   - Widely used and recommended
   - Resistant to known attacks
   - Industry standard for password storage

### Defense in Depth

**Even with hashing, additional protections:**

1. **Database Breach Scenario:**
   ```
   Attacker gets: "$2b$12$abcdefghijklmnopqrstuv..."
   Attacker tries: Reverse hash
   Result: Computationally infeasible (years/centuries)
   ```

2. **Rainbow Table Attack:**
   ```
   Pre-computed hash table
   Defeated by: Unique salt per password
   ```

3. **Brute Force Attack:**
   ```
   Try millions of passwords
   Defeated by: bcrypt's slow hashing (cost factor 10)
   ```

### Password Verification

**How login works with hashes:**
```javascript
// Registration (store hash)
const passwordHash = await bcrypt.hash('password123', 10);
// Store: "$2b$12$abcdefghijklmnopqrstuv..."

// Login (verify password)
const isMatch = await bcrypt.compare('password123', storedHash);
// Returns: true if match, false if not
```

**Key Points:**
- Never store plain password
- Never try to "decrypt" the hash
- Use bcrypt.compare() to verify
- No way to recover original password

### Key Points Summary

| Aspect | Explanation |
|--------|-------------|
| **One-way function** | Cannot reverse a hash to get the original password |
| **Salt** | Each password gets a unique random salt, preventing rainbow table attacks |
| **Cost factor** | bcrypt's work factor (10) makes brute-force attacks computationally expensive |
| **Industry standard** | bcrypt is widely recommended for password storage |
| **Defense in depth** | Even if the database is leaked, passwords remain protected |

### Real-World Impact

**Without Hashing:**
- LinkedIn breach (2012): 6.5 million plain passwords exposed
- Adobe breach (2013): 150 million passwords exposed
- Immediate account compromises across multiple services

**With Hashing:**
- Even if database is leaked, passwords are protected
- Time to warn users and rotate credentials
- Minimal immediate impact from breach
- Best practice compliance

---

## Question (d)

**The name column is NOT NULL: why did you still need your own check for an empty name?**

### Answer

The `NOT NULL` constraint only prevents `NULL` values from being stored in the database. It does not prevent empty strings (`''`) or strings containing only whitespace. A user could submit a form with an empty name field, which would be stored as an empty string in the database (not NULL). Our own check ensures that the name field contains actual content, not just whitespace, providing a better user experience and data quality.

### Database vs Application Validation

**NOT NULL Constraint:**
```sql
CREATE TABLE users (
    name VARCHAR(100) NOT NULL,
    ...
);
```

**What NOT NULL Prevents:**
```sql
-- This is rejected by NOT NULL
INSERT INTO users (name, email, password_hash)
VALUES (NULL, 'john@mail.com', '$2b$12$...');
-- Error: Column 'name' cannot be null
```

**What NOT NULL Allows:**
```sql
-- These are ALLOWED by NOT NULL
INSERT INTO users (name, email, password_hash)
VALUES ('', 'john@mail.com', '$2b$12$...');  -- Empty string
-- Success!

INSERT INTO users (name, email, password_hash)
VALUES ('   ', 'john@mail.com', '$2b$12$...');  -- Whitespace only
-- Success!
```

### Why This is a Problem

**Empty String:**
- User submits form with empty name field
- Database stores: `''` (empty string, not NULL)
- User account created with no name
- UI displays empty or ugly name

**Whitespace Only:**
- User submits form with spaces in name field
- Database stores: `'   '` (whitespace, not NULL)
- User account created with only spaces
- UI displays nothing or awkward spacing

### Application-Level Validation

**Our Check:**
```javascript
const name = req.body.name?.trim();

if (!name) {
  return 'Name is required';
}
```

**What This Prevents:**
```javascript
// Empty string
name = '';           // trim() → ''        // !name → true  → Error
name = '   ';        // trim() → ''        // !name → true  → Error
name = 'John';       // trim() → 'John'    // !name → false → OK
name = '  John  ';   // trim() → 'John'   // !name → false → OK
```

### Comparison Table

| Constraint Type | What It Prevents | What It Allows |
|-----------------|------------------|----------------|
| `NOT NULL` | NULL values | Empty strings, whitespace |
| Application check | Empty strings, whitespace | Valid content |

### Why Both Are Needed

**1. Database Constraints (Last Line of Defense)**
- Enforced at database level
- Work even if application logic fails
- Prevent NULL values from entering database
- Ensure data integrity

**2. Application Validation (First Line of Defense)**
- Provides better user experience
- Can give specific error messages
- Validates business rules (not empty, not whitespace)
- Prevents unnecessary database queries

**3. Defense in Depth**
```
User Input
    ↓
Application Validation (checks for empty/whitespace)
    ↓
Database Constraint (checks for NULL)
    ↓
Clean Data
```

### Real-World Example

**Scenario 1: User submits empty name**
```
Without application check:
1. Form submitted with name = ''
2. Database accepts (NOT NULL allows empty string)
3. User created with empty name
4. UI displays "Hello, " (awkward)

With application check:
1. Form submitted with name = ''
2. Application validation: "Name is required"
3. User sees error message
4. User must enter valid name
```

**Scenario 2: Application logic has bug**
```
Without database constraint:
1. Application bug passes NULL name
2. Database accepts NULL (if no NOT NULL)
3. User created with NULL name
4. Potential application crashes

With database constraint:
1. Application bug passes NULL name
2. Database rejects (NOT NULL)
3. Error logged, data protected
4. Application handles gracefully
```

### Specific Error Messages

**Application Validation:**
- "Name is required" (clear, actionable)
- Shows exactly what's wrong
- Guides user to fix

**Database Constraint:**
- Generic SQL error (not user-friendly)
- "Column 'name' cannot be null"
- Technical jargon, not helpful to users

### Data Quality

**Without Application Check:**
```
Users table:
user_id | name   | email
--------|--------|-----------------
1       |        | john@mail.com   (empty)
2       |        | jane@mail.com   (empty)
3       |        | bob@mail.com    (empty)
```

**With Application Check:**
```
Users table:
user_id | name   | email
--------|--------|-----------------
1       | John   | john@mail.com
2       | Jane   | jane@mail.com
3       | Bob    | bob@mail.com
```

### Best Practice

**Always use both:**

1. **Database Constraints**
   - NOT NULL for required fields
   - UNIQUE for unique identifiers
   - CHECK for complex rules
   - FOREIGN KEY for relationships

2. **Application Validation**
   - Required field checks
   - Format validation (email, phone, etc.)
   - Business rule validation
   - User-friendly error messages

3. **Why This Works**
   - Application provides good UX
   - Database provides integrity
   - If one fails, the other protects
   - Defense in depth principle

### Summary

The `NOT NULL` constraint is important but insufficient alone. It prevents NULL values but allows empty strings and whitespace. Application-level validation ensures the name field contains actual meaningful content, providing better data quality and user experience. Together, they provide defense in depth: application validation for UX and database constraints for integrity.
