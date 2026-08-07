const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let todos = [
  { id: 1, text: 'Build React Frontend', completed: true },
  { id: 2, text: 'Deploy Express Backend API', completed: true },
  { id: 3, text: 'Test Full-Stack Deployment on Vercel', completed: false }
];

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SPARK Express Backend API is running serverless!' });
});

// GET /api/todos
app.get('/api/todos', (req, res) => {
  res.json({ success: true, count: todos.length, items: todos });
});

// POST /api/todos
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const item = { id: Date.now(), text, completed: false };
  todos.push(item);
  res.json({ success: true, item });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));
}

module.exports = app;
