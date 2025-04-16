const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

app.use(cors()); // Allow all origins by default
app.use(express.json());

// In-memory storage
let blogs = [];
let currentId = 1;

// Hardcoded users
const users = [
  { username: 'admin', password: 'password123' }
];

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Login endpoint
app.post('/login', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(400).json({ message: 'Missing or invalid Authorization header' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Get all blog entries
app.get('/blogs', (req, res) => {
  res.json(blogs);
});

// Get a single blog entry
app.get('/blogs/:id', (req, res) => {
  const blog = blogs.find(b => b.id === parseInt(req.params.id));
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog);
});

// Create a new blog entry (requires authentication)
app.post('/blogs', authenticateToken, (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing or invalid' });
  }

  const { title, content } = req.body;

  // Validate title and content
  if (!title || !content || title.trim() === '' || content.trim() === '') {
    return res.status(400).json({ message: 'Title and content are required and cannot be blank' });
  }

  const newBlog = {
    id: currentId++,
    title,
    content,
    date: new Date(),
    created_by: req.user.username // Record the username of the authenticated user
  };

  blogs.push(newBlog);
  res.status(201).json(newBlog);
});

// Update a blog entry (requires authentication)
app.put('/blogs/:id', authenticateToken, (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing or invalid' });
  }

  const { title, content } = req.body;

  // Validate title and content
  if (!title || !content || title.trim() === '' || content.trim() === '') {
    return res.status(400).json({ message: 'Title and content are required and cannot be blank' });
  }

  const blog = blogs.find(b => b.id === parseInt(req.params.id));
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  blog.title = title;
  blog.content = content;
  res.json(blog);
});

// Delete a blog entry (requires authentication)
app.delete('/blogs/:id', authenticateToken, (req, res) => {
  const index = blogs.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Blog not found' });

  const deleted = blogs.splice(index, 1);
  res.json(deleted[0]);
});

app.listen(PORT, () => {
  console.log(`Blog API running at http://localhost:${PORT}`);
});
