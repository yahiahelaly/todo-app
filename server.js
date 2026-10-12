require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'registration',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Middleware to redirect to list if already logged in
function requireGuest(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/list');
    }
    next();
}

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/list');
    } else {
        res.redirect('/login');
    }
});

// Register page
app.get('/register', requireGuest, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Register handler
app.post('/register', requireGuest, async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    const errors = {};

    // Server-side validation
    if (!name || name.trim() === '') {
        errors.name = 'Name is required';
    }
    if (!email || email.trim() === '') {
        errors.email = 'Email is required';
    }
    if (!password || password.trim() === '') {
        errors.password = 'Password is required';
    }
    if (!confirmPassword || confirmPassword.trim() === '') {
        errors.confirmPassword = 'Confirm password is required';
    }
    if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
        req.session.errors = errors;
        return res.sendFile(path.join(__dirname, 'public', 'register.html'));
    }

    try {
        // Check if email already exists
        const [existingUsers] = await pool.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            req.session.errors = { email: 'Email Already Exists' };
            return res.sendFile(path.join(__dirname, 'public', 'register.html'));
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
            [email, name, passwordHash]
        );

        // Get the new user's ID and log them in
        const [newUser] = await pool.execute(
            'SELECT user_id, name FROM users WHERE email = ?',
            [email]
        );
        
        req.session.userId = newUser[0].user_id;
        req.session.name = newUser[0].name;
        req.session.errors = null;
        res.redirect('/list');

    } catch (error) {
        console.error('Registration error:', error);
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    }
});

// Login page
app.get('/login', requireGuest, (req, res) => {
    req.session.errors = null;
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Clear errors when visiting login/register pages
app.get('/register', requireGuest, (req, res) => {
    req.session.errors = null;
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Get errors from session
app.get('/api/errors', (req, res) => {
    res.json({ errors: req.session.errors || {} });
});

// Login handler
app.post('/login', requireGuest, async (req, res) => {
    const { email, password } = req.body;
    const errors = {};

    // Server-side validation
    if (!email || email.trim() === '') {
        errors.email = 'Email is required';
    }
    if (!password || password.trim() === '') {
        errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
        req.session.errors = errors;
        return res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    try {
        const [users] = await pool.execute(
            'SELECT user_id, name, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            req.session.errors = { general: 'Invalid email or password' };
            return res.sendFile(path.join(__dirname, 'public', 'login.html'));
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            req.session.errors = { general: 'Invalid email or password' };
            return res.sendFile(path.join(__dirname, 'public', 'login.html'));
        }

        // Set session
        req.session.userId = user.user_id;
        req.session.name = user.name;
        req.session.errors = null;
        res.redirect('/list');

    } catch (error) {
        console.error('Login error:', error);
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// To-do list page
app.get('/list', requireAuth, async (req, res) => {
    try {
        const [todos] = await pool.execute(
            'SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC',
            [req.session.userId]
        );
        res.sendFile(path.join(__dirname, 'public', 'list.html'));
    } catch (error) {
        console.error('Fetch todos error:', error);
        res.sendFile(path.join(__dirname, 'public', 'list.html'));
    }
});

// API: Get todos
app.get('/api/todos', requireAuth, async (req, res) => {
    try {
        const [todos] = await pool.execute(
            'SELECT todo_id, title, is_done, created_at FROM todos WHERE user_id = ? ORDER BY todo_id DESC',
            [req.session.userId]
        );
        res.json({ todos, userName: req.session.name });
    } catch (error) {
        console.error('API fetch todos error:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// API: Add todo
app.post('/api/todos', requireAuth, async (req, res) => {
    const { title } = req.body;
    const errors = {};

    if (!title || title.trim() === '') {
        errors.title = 'Title is required';
    } else if (title.trim().length > 200) {
        errors.title = 'Title is too long (200 characters at most)';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        await pool.execute(
            'INSERT INTO todos (user_id, title) VALUES (?, ?)',
            [req.session.userId, title.trim()]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Add todo error:', error);
        res.status(500).json({ error: 'Failed to add todo' });
    }
});

// API: Edit todo
app.put('/api/todos/:id', requireAuth, async (req, res) => {
    const { title } = req.body;
    const todoId = req.params.id;
    const errors = {};

    if (!title || title.trim() === '') {
        errors.title = 'Title is required';
    } else if (title.trim().length > 200) {
        errors.title = 'Title is too long (200 characters at most)';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        await pool.execute(
            'UPDATE todos SET title = ? WHERE todo_id = ? AND user_id = ?',
            [title.trim(), todoId, req.session.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Edit todo error:', error);
        res.status(500).json({ error: 'Failed to edit todo' });
    }
});

// API: Toggle todo done status
app.patch('/api/todos/:id/toggle', requireAuth, async (req, res) => {
    const todoId = req.params.id;
    const { is_done } = req.body;

    try {
        await pool.execute(
            'UPDATE todos SET is_done = ? WHERE todo_id = ? AND user_id = ?',
            [is_done ? 1 : 0, todoId, req.session.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Toggle todo error:', error);
        res.status(500).json({ error: 'Failed to toggle todo' });
    }
});

// API: Delete todo
app.delete('/api/todos/:id', requireAuth, async (req, res) => {
    const todoId = req.params.id;

    try {
        await pool.execute(
            'DELETE FROM todos WHERE todo_id = ? AND user_id = ?',
            [todoId, req.session.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Delete todo error:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
