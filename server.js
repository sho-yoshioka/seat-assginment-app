const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { promises: fsp } = fs;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'assigned_numbers.json');
let assignedNumbersByEvent = {};
const maxNumber = Number(process.env.MAX_SEATS) || 100; // maximum seats

loadData().catch(() => {
  assignedNumbersByEvent = {};
});

async function loadData() {
  const raw = await fsp.readFile(DATA_FILE, 'utf8').catch(() => null);
  if (!raw) {
    assignedNumbersByEvent = {};
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    assignedNumbersByEvent = {};
    for (const [eventId, numbers] of Object.entries(parsed)) {
      assignedNumbersByEvent[eventId] = new Set(numbers);
    }
  } catch {
    assignedNumbersByEvent = {};
  }
}

async function saveData() {
  const data = {};
  for (const [eventId, set] of Object.entries(assignedNumbersByEvent)) {
    data[eventId] = Array.from(set);
  }
  await fsp.writeFile(DATA_FILE, JSON.stringify(data));
}

async function getRandomAvailableNumber(eventId) {
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
  await saveData();
  return num;
}

app.get('/api/assign', async (req, res) => {
  const eventId = req.query.eventId;
  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  const cookieKey = `seatNumber_${eventId}`;
  if (req.cookies && req.cookies[cookieKey]) {
    return res.json({ seatNumber: Number(req.cookies[cookieKey]) });
  }

  const num = await getRandomAvailableNumber(eventId);
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
