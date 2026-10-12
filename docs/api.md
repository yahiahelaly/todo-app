# API Documentation

Complete reference for all API endpoints in the To-Do List Application.

---

## Authentication Endpoints

### POST /register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Validation Rules:**
- `name`: Required, cannot be empty or whitespace
- `email`: Required, must be unique
- `password`: Required
- `confirmPassword`: Required, must match `password`

**Response:**
- **Success**: Redirects to `/list` with session created
- **Error**: Redirects to `/register` with error messages

**Error Messages:**
- "Name is required"
- "Email is required"
- "Password is required"
- "Confirm password is required"
- "Passwords do not match"
- "Email Already Exists"

---

### POST /login
Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Required
- `password`: Required

**Response:**
- **Success**: Redirects to `/list` with session created
- **Error**: Redirects to `/login` with error message

**Error Messages:**
- "Email is required"
- "Password is required"
- "Invalid email or password" (unified for both wrong email and wrong password to prevent user enumeration)

---

### POST /logout
Destroy the user session.

**Response:** Redirects to `/login`

---

## To-Do Endpoints

### GET /api/todos
Get all to-dos for the logged-in user.

**Authentication:** Required (session must contain valid `user_id`)

**Response:**
```json
{
  "todos": [
    {
      "todo_id": 1,
      "title": "Buy groceries",
      "is_done": 0,
      "created_at": "2026-10-11T18:00:00.000Z"
    },
    {
      "todo_id": 2,
      "title": "Finish the lab",
      "is_done": 1,
      "created_at": "2026-10-11T19:30:00.000Z"
    }
  ],
  "userName": "John Doe"
}
```

**SQL Query:**
```sql
SELECT todo_id, title, is_done, created_at
FROM todos
WHERE user_id = ?
ORDER BY todo_id DESC
```

---

### POST /api/todos
Create a new to-do item.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "New to-do item"
}
```

**Validation Rules:**
- `title`: Required, max 200 characters, cannot be empty or whitespace

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "errors": {
    "title": "Title is required"
  }
}
```

**Error Messages:**
- "Title is required" (for empty or whitespace-only title)
- "Title is too long" (exceeds 200 characters)

---

### PUT /api/todos/:id
Update a to-do item's title.

**Authentication:** Required

**URL Parameters:**
- `id`: The `todo_id` of the to-do to update

**Request Body:**
```json
{
  "title": "Updated title"
}
```

**Validation Rules:**
- Same as POST /api/todos

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "errors": {
    "title": "Title is required"
  }
}
```

**SQL Query:**
```sql
UPDATE todos
SET title = ?
WHERE todo_id = ? AND user_id = ?
```

---

### PATCH /api/todos/:id/toggle
Toggle a to-do's completion status.

**Authentication:** Required

**URL Parameters:**
- `id`: The `todo_id` of the to-do to toggle

**Request Body:**
```json
{
  "is_done": true
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**SQL Query:**
```sql
UPDATE todos
SET is_done = ?
WHERE todo_id = ? AND user_id = ?
```

---

### DELETE /api/todos/:id
Delete a to-do item.

**Authentication:** Required

**URL Parameters:**
- `id`: The `todo_id` of the to-do to delete

**Response (Success):**
```json
{
  "success": true
}
```

**SQL Query:**
```sql
DELETE FROM todos
WHERE todo_id = ? AND user_id = ?
```

**Security Note:** The `AND user_id = ?` clause ensures users can only delete their own to-dos.

---

## Utility Endpoints

### GET /api/errors
Get current session errors (for displaying server-side validation messages).

**Response:**
```json
{
  "errors": {
    "email": "Email Already Exists"
  }
}
```

**Note:** Used by frontend to display errors stored in session after form submission.

---

## Response Status Codes

The application uses HTTP status codes as follows:

- **200 OK**: Successful GET request
- **302 Found**: Redirect (login/logout/register success/failure)
- **400 Bad Request**: Invalid input (should have error details in response)
- **500 Internal Server Error**: Server error (not exposed to user, generic error message shown)

---

## Error Handling

All errors are caught and handled gracefully:

1. **Database Errors**: Logged to console, generic error message sent to user
2. **Validation Errors**: Specific error messages returned to user
3. **Authentication Errors**: Unified error messages to prevent user enumeration
4. **No Stack Traces**: Never exposed to end users

---

## Security Notes

1. **Session-Based Auth**: All to-do endpoints require a valid session with `user_id`
2. **User Isolation**: All queries include `WHERE user_id = ?` to prevent cross-user data access
3. **Prepared Statements**: All SQL queries use parameterized queries to prevent injection
4. **No Raw Input**: Never trust user input, always validate and sanitize
