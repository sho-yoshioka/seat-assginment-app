const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'assigned_numbers.json');
let assignedNumbersByEvent = {};
const maxNumber = 100; // maximum seats for now

loadData();

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    assignedNumbersByEvent = {};
    for (const [eventId, numbers] of Object.entries(parsed)) {
      assignedNumbersByEvent[eventId] = new Set(numbers);
    }
  } catch (err) {
    assignedNumbersByEvent = {};
  }
}

function saveData() {
  const data = {};
  for (const [eventId, set] of Object.entries(assignedNumbersByEvent)) {
    data[eventId] = Array.from(set);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

function getRandomAvailableNumber(eventId) {
  if (!assignedNumbersByEvent[eventId]) {
    assignedNumbersByEvent[eventId] = new Set();
  }
  const assignedNumbers = assignedNumbersByEvent[eventId];
  if (assignedNumbers.size >= maxNumber) {
    return null; // all seats taken
  }
  let num;
  do {
    num = Math.floor(Math.random() * maxNumber) + 1;
  } while (assignedNumbers.has(num));
  assignedNumbers.add(num);
  saveData();
  return num;
}

app.get('/api/assign', (req, res) => {
  const eventId = req.query.eventId;
  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  const cookieKey = `seatNumber_${eventId}`;
  if (req.cookies && req.cookies[cookieKey]) {
    return res.json({ seatNumber: Number(req.cookies[cookieKey]) });
  }

  const num = getRandomAvailableNumber(eventId);
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie(cookieKey, num, { httpOnly: true });
  res.json({ seatNumber: num });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
