# Features Implementation

Detailed breakdown of all features implemented in the To-Do List Application (R1-R10).

---

## R1 - User Registration

### Implementation Location
- `server.js` - Registration route and database logic
- `public/register.html` - Registration form UI
- `public/register.js` - Client-side validation

### Features
- Registration form with name, email, password, and confirm password fields
- Real-time client-side validation using JavaScript
- Server-side validation with exact error messages
- Duplicate email detection returning "Email Already Exists"
- Automatic session creation and login after successful registration
- Password hashing using bcrypt (cost factor 10)

### Validation Rules
- **Name**: Required, cannot be empty or whitespace
- **Email**: Required, must be unique in database
- **Password**: Required
- **Confirm Password**: Required, must match password

### Validation Messages
- "Name is required"
- "Email is required"
- "Password is required"
- "Confirm password is required"
- "Passwords do not match"
- "Email Already Exists"

### Technical Details

**Client-Side Validation:**
```javascript
function validateForm() {
  // Check if fields are empty
  // Check if passwords match
  // Clear errors on input
}
```

**Server-Side Logic:**
```javascript
// Check for duplicate email
const [existing] = await pool.execute(
  'SELECT user_id FROM users WHERE email = ?',
  [email]
);

if (existing.length > 0) {
  return 'Email Already Exists';
}

// Hash password
const passwordHash = await bcrypt.hash(password, 10);

// Insert user
await pool.execute(
  'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
  [name, email, passwordHash]
);

// Create session
req.session.userId = result.insertId;
req.session.userName = name;
```

---

## R2 - User Login & Logout

### Implementation Location
- `server.js` - Login/logout routes and session management
- `public/login.html` - Login form UI
- `public/login.js` - Client-side validation

### Features
- Login form with email and password fields
- Unified error message for authentication failures
- Session-based authentication using express-session
- Secure logout that destroys the session
- Password verification using bcrypt.compare()

### Validation Rules
- **Email**: Required
- **Password**: Required

### Validation Messages
- "Email is required"
- "Password is required"
- "Invalid email or password" (unified for both wrong email and wrong password)

### Security Note
Both wrong email and wrong password return the same message "Invalid email or password" to prevent user enumeration attacks. This prevents attackers from determining which email addresses are registered.

### Technical Details

**Login Logic:**
```javascript
// Find user by email
const [users] = await pool.execute(
  'SELECT user_id, name, email, password_hash FROM users WHERE email = ?',
  [email]
);

if (users.length === 0) {
  return 'Invalid email or password';
}

// Verify password
const isMatch = await bcrypt.compare(password, users[0].password_hash);

if (!isMatch) {
  return 'Invalid email or password';
}

// Create session
req.session.userId = users[0].user_id;
req.session.userName = users[0].name;
```

**Logout Logic:**
```javascript
req.session.destroy((err) => {
  if (err) {
    console.error('Session destruction error:', err);
  }
  res.redirect('/login');
});
```

---

## R3 - Private To-Do Lists

### Implementation Location
- `server.js` - Middleware and authentication checks

### Features
- Middleware-based authentication check (`requireAuth`)
- Automatic redirect to login for unauthenticated users
- Session-based user identification
- User isolation - each user sees only their own to-dos
- To-dos ordered by creation date (newest first)

### Middleware Implementation

**requireAuth Middleware:**
```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}
```

**requireGuest Middleware:**
```javascript
function requireGuest(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/list');
  }
  next();
}
```

### Security Implementation

All to-do queries use the user's ID from the session:

```sql
SELECT todo_id, title, is_done, created_at
FROM todos
WHERE user_id = ?  -- From session, not form
ORDER BY todo_id DESC
```

**Key Security Points:**
- user_id always from session, never from form data
- Cannot be manipulated by user
- Prevents horizontal privilege escalation

---

## R4 - Add To-Do Items

### Implementation Location
- `server.js` - POST /api/todos route
- `public/list.js` - AJAX submission and validation

### Features
- Add new to-do items with a title field
- Client-side validation (required, max 200 characters)
- Server-side validation with exact error messages
- AJAX submission without page reload
- Automatic refresh of to-do list after addition

### Validation Rules
- **Title**: Required, max 200 characters, cannot be empty or whitespace

### Validation Messages
- "Title is required" for an empty or whitespace-only title
- "Title is too long" when the title exceeds 200 characters

### Technical Details

**Client-Side Validation:**
```javascript
const title = titleInput.value.trim();

if (!title) {
  showError('Title is required');
  return;
}

if (title.length > 200) {
  showError('Title is too long');
  return;
}
```

**Server-Side Logic:**
```javascript
const title = req.body.title?.trim();

if (!title) {
  return res.json({ errors: { title: 'Title is required' } });
}

if (title.length > 200) {
  return res.json({ errors: { title: 'Title is too long' } });
}

await pool.execute(
  'INSERT INTO todos (user_id, title) VALUES (?, ?)',
  [req.session.userId, title]
);

res.json({ success: true });
```

---

## R5 - Edit To-Do Titles

### Implementation Location
- `server.js` - PUT /api/todos/:id route
- `public/list.js` - Modal dialog and AJAX update

### Features
- Modal dialog for editing to-do titles
- Pre-populated with current title
- Same validation as add operation
- AJAX update without page reload
- Real-time list refresh after edit

### Validation Rules
- Same as R4 (Add To-Do)

### Validation Messages
- Same as R4 (Add To-Do)

### Technical Details

**Modal UI:**
- Opens when edit button clicked
- Shows current title in input field
- Cancel and Save buttons
- Fade-in/scale animation

**AJAX Update:**
```javascript
fetch(`/api/todos/${todoId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: newTitle })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    refreshTodoList();
  }
});
```

**Server Logic:**
```javascript
await pool.execute(
  'UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?',
  [title, todoId, req.session.userId]
);
```

---

## R6 - Toggle Completion Status

### Implementation Location
- `server.js` - PATCH /api/todos/:id/toggle route
- `public/list.js` - Checkbox event handler

### Features
- Checkbox to mark to-dos as done/not done
- Visual feedback with strikethrough and opacity
- Instant AJAX toggle without page reload
- Persistent state in database (is_done: 0/1)

### Technical Details

**Visual Feedback:**
```css
.todo-item.completed {
  text-decoration: line-through;
  opacity: 0.6;
}
```

**AJAX Toggle:**
```javascript
fetch(`/api/todos/${todoId}/toggle`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_done: !currentStatus })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    toggleVisualState();
  }
});
```

**Server Logic:**
```javascript
await pool.execute(
  'UPDATE todos SET is_done = ? WHERE todo_id = ? AND user_id = ?',
  [is_done, todoId, req.session.userId]
);
```

---

## R7 - Delete To-Do Items

### Implementation Location
- `server.js` - DELETE /api/todos/:id route
- `public/list.js` - Delete button and confirmation modal

### Features
- Delete button on each to-do item
- Confirmation modal dialog ("Are you sure?")
- Prevents accidental deletion
- AJAX deletion with immediate list update
- User isolation check in DELETE query

### Technical Details

**Confirmation Modal:**
- Shows when delete button clicked
- "Are you sure you want to delete this to-do?"
- Cancel and Confirm buttons
- Prevents accidental deletions

**AJAX Delete:**
```javascript
fetch(`/api/todos/${todoId}`, {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    removeTodoFromDOM();
  }
});
```

**Server Logic:**
```javascript
await pool.execute(
  'DELETE FROM todos WHERE todo_id = ? AND user_id = ?',
  [todoId, req.session.userId]
);
```

**Security Note:** `AND user_id = ?` ensures users can only delete their own to-dos.

---

## R8 - Comprehensive Validation

### Implementation Location
- All forms in `register.js`, `login.js`, `list.js`
- Corresponding server routes in `server.js`

### Client-Side Validation

**Features:**
- JavaScript checks before form submission
- Real-time error clearing on input
- Prevents unnecessary server requests
- Better user experience with immediate feedback

**Implementation:**
```javascript
// Clear error on input
input.addEventListener('input', () => {
  clearError(input);
});

// Validate on submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (validateForm()) {
    submitForm();
  }
});
```

### Server-Side Validation

**Features:**
- Server-side checks for all inputs
- Session-based error storage for registration/login
- JSON error responses for to-do API requests
- Fallback validation for JavaScript-disabled browsers
- Final line of defense

**Implementation:**

**Registration/Login (Session-based):**
```javascript
req.session.errors = {
  email: 'Email Already Exists'
};
res.redirect('/register');
```

**To-Dos (JSON response):**
```javascript
res.json({
  errors: {
    title: 'Title is required'
  }
});
```

### Error Messages Summary

**Registration:**
- Name required
- Email required
- Password required
- Confirm password required
- Passwords do not match
- Email Already Exists

**Login:**
- Email required
- Password required
- Invalid email or password

**Add/Edit To-Dos:**
- Title required
- Title too long (200 characters at most)

---

## R9 - Security Implementation

### Implementation Location
- Throughout `server.js`

### Security Features

#### 1. Password Hashing

**Algorithm:** bcrypt with cost factor 10

**Implementation:**
```javascript
const bcrypt = require('bcryptjs');
const passwordHash = await bcrypt.hash(password, 10);
```

**Benefits:**
- One-way hashing (irreversible)
- Automatic salt generation
- Computationally expensive for brute-force
- Industry standard

---

#### 2. SQL Injection Prevention

**Method:** Prepared statements with parameterized queries

**Implementation:**
```javascript
// Vulnerable (NOT USED):
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Secure (USED):
const query = 'SELECT * FROM users WHERE email = ?';
const [rows] = await pool.execute(query, [email]);
```

**Benefits:**
- No string concatenation in queries
- Automatic escaping by mysql2
- Parameters treated as data, not code
- Protection against SQL injection

---

#### 3. Session Security

**Implementation:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

**Benefits:**
- Signed cookies prevent tampering
- HTTP-only prevents XSS cookie theft
- Session destruction on logout
- User ID from session, not form

---

#### 4. User Isolation

**Implementation:**
```sql
-- All queries include user_id from session
SELECT * FROM todos WHERE user_id = ?
UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?
DELETE FROM todos WHERE todo_id = ? AND user_id = ?
```

**Benefits:**
- Prevents cross-user data access
- User ID from session (cannot be manipulated)
- Referential integrity via foreign keys
- Defense in depth

---

## R10 - User Interface Design

### Implementation Location
- `public/styles.css` - All styling
- All HTML files - Structure and semantics

### Design Features

#### Consistent Styling

**Theme:**
- Purple gradient background
- Glassmorphism card effects
- Unified button styles
- Consistent typography

**Implementation:**
```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

#### Responsive Design

**Features:**
- Mobile-first approach (360px minimum)
- Flexbox-based layouts
- Media queries for different screen sizes
- Touch-friendly button sizes

**Implementation:**
```css
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  .card {
    width: 100%;
  }
}
```

---

#### User Feedback

**Features:**
- Clear error messages near form fields
- Visual state for completed to-dos
- Friendly empty state message
- User name and logout button always visible
- Loading states for AJAX requests

**Implementation:**
```css
.error {
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.todo-item.completed {
  text-decoration: line-through;
  opacity: 0.6;
}
```

---

#### Animations

**Features:**
- Floating card animation
- Slide-in form fields
- Button hover effects with shine
- Modal fade-in/scale animations
- Smooth transitions throughout

**Implementation:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.card {
  animation: float 6s ease-in-out infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.modal {
  animation: fadeIn 0.3s ease-out;
}
```

---

#### No Raw Errors

**Features:**
- All errors caught and handled gracefully
- User-friendly error messages
- No stack traces exposed to users
- Try-catch blocks on all async operations

**Implementation:**
```javascript
try {
  await pool.execute(query, params);
} catch (error) {
  console.error('Database error:', error);
  return res.status(500).json({ error: 'An error occurred' });
}
```

---

## Bonus Features

### Potential Enhancements (Not Implemented)

- Due dates for to-dos
- Filtering (all/open/done)
- Search functionality
- Dark mode toggle
- Counting open to-dos
- Deployment to cloud hosting
- Automated testing suite
- Drag-and-drop reordering
- To-do categories/tags
- Priority levels
- Reminders/notifications
- Export to CSV
- Share lists with other users

---

## Summary

All required features (R1-R10) have been successfully implemented with:

- ✅ Secure authentication and session management
- ✅ Private, isolated to-do lists
- ✅ Full CRUD operations with AJAX
- ✅ Comprehensive validation (client and server)
- ✅ Security best practices (hashing, prepared statements, user isolation)
- ✅ Modern, responsive UI with animations
- ✅ User-friendly error handling
