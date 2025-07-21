const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));

// Track assigned seat numbers per event ID
const eventAssignments = {};
let maxNumber = 100; // maximum seats for now

function getAssignments(eventId) {
  if (!eventAssignments[eventId]) {
    eventAssignments[eventId] = new Set();
  }
  return eventAssignments[eventId];
}

function getRandomAvailableNumber(eventId) {
  const assignedNumbers = getAssignments(eventId);
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
  const eventId = req.query.event || 'default';
  const cookieName = `seatNumber_${eventId}`;
  if (req.cookies && req.cookies[cookieName]) {
    return res.json({ seatNumber: Number(req.cookies[cookieName]) });
  }
  const num = getRandomAvailableNumber(eventId);
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie(cookieName, num, { httpOnly: true });
  res.json({ seatNumber: num });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
