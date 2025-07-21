const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

let assignedNumbers = new Set();
let maxNumber = 100; // maximum seats for now

// Load or initialize events
const eventsFile = path.join(__dirname, 'events.json');
let events = [];
try {
  if (fs.existsSync(eventsFile)) {
    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  }
} catch (err) {
  console.error('Failed to read events file:', err);
  events = [];
}

function saveEvents() {
  try {
    fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
  } catch (err) {
    console.error('Failed to write events file:', err);
  }
}

function adminAuth(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.body.password || req.query.password;
  if (pwd === '1234') {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

function getRandomAvailableNumber() {
  if (assignedNumbers.size >= maxNumber) {
    return null; // all seats taken
  }
  let num;
  do {
    num = Math.floor(Math.random() * maxNumber) + 1;
  } while (assignedNumbers.has(num));
  assignedNumbers.add(num);
  return num;
}

app.get('/api/assign', (req, res) => {
  if (req.cookies && req.cookies.seatNumber) {
    return res.json({ seatNumber: Number(req.cookies.seatNumber) });
  }
  const num = getRandomAvailableNumber();
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie('seatNumber', num, { httpOnly: true });
  res.json({ seatNumber: num });
});

// Admin routes
app.get('/admin/events', adminAuth, (req, res) => {
  res.json({ events });
});

app.post('/admin/events', adminAuth, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Event name required' });
  }
  const event = { id: events.length + 1, name };
  events.push(event);
  saveEvents();
  res.status(201).json(event);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
