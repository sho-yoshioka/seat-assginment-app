const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

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

function getEventById(id) {
  return events.find(e => String(e.id) === String(id));
}

function getRandomAvailableNumber(event) {
  if (!event.assignedNumbers) {
    event.assignedNumbers = [];
  }
  if (event.assignedNumbers.length >= event.maxSeats) {
    return null; // all seats taken
  }
  let num;
  do {
    num = Math.floor(Math.random() * event.maxSeats) + 1;
  } while (event.assignedNumbers.includes(num));
  event.assignedNumbers.push(num);
  return num;
}

app.get('/api/events/:id/assign', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const cookieName = `seatNumber_${event.id}`;
  if (req.cookies && req.cookies[cookieName]) {
    return res.json({ eventName: event.name, seatNumber: Number(req.cookies[cookieName]) });
  }
  const num = getRandomAvailableNumber(event);
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie(cookieName, num, { httpOnly: true });
  saveEvents();
  res.json({ eventName: event.name, seatNumber: num });
});

app.get('/api/events/:id', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ id: event.id, name: event.name, maxSeats: event.maxSeats });
});

// Admin routes
app.get('/admin/events', adminAuth, (req, res) => {
  const sanitized = events.map(e => ({ id: e.id, name: e.name, maxSeats: e.maxSeats }));
  res.json({ events: sanitized });
});

app.post('/admin/events', adminAuth, (req, res) => {
  const { name, maxSeats } = req.body;
  if (!name || !maxSeats) {
    return res.status(400).json({ error: 'Event name and maxSeats required' });
  }
  const event = { id: events.length + 1, name, maxSeats: Number(maxSeats), assignedNumbers: [] };
  events.push(event);
  saveEvents();
  res.status(201).json(event);
});

app.get('/admin/events/:id/qrcode', adminAuth, async (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const url = `${req.protocol}://${req.get('host')}/?event=${event.id}`;
  try {
    const code = await QRCode.toDataURL(url);
    const img = Buffer.from(code.split(',')[1], 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(img);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
