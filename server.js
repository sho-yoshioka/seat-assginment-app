const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));

let assignedNumbers = new Set();
let maxNumber = 100; // maximum seats for now
let assignedNumbersByEvent = new Map();

function getRandomAvailableNumber(set) {
  if (set.size >= maxNumber) {
    return null; // all seats taken
  }
  let num;
  do {
    num = Math.floor(Math.random() * maxNumber) + 1;
  } while (set.has(num));
  set.add(num);
  return num;
}

app.get('/api/assign', (req, res) => {
  if (req.cookies && req.cookies.seatNumber) {
    return res.json({ seatNumber: Number(req.cookies.seatNumber) });
  }
  const num = getRandomAvailableNumber(assignedNumbers);
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie('seatNumber', num, { httpOnly: true });
  res.json({ seatNumber: num });
});

app.get('/api/event/:id/assign', (req, res) => {
  const key = req.params.id;
  if (req.cookies && req.cookies[`seatNumber_${key}`]) {
    return res.json({ seatNumber: Number(req.cookies[`seatNumber_${key}`]) });
  }
  if (!assignedNumbersByEvent.has(key)) {
    assignedNumbersByEvent.set(key, new Set());
  }
  const set = assignedNumbersByEvent.get(key);
  const num = getRandomAvailableNumber(set);
  if (num === null) {
    return res.status(409).json({ error: 'No seats available' });
  }
  res.cookie(`seatNumber_${key}`, num, { httpOnly: true });
  res.json({ seatNumber: num });
});

app.get('/api/event/:id/qrcode', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/event/${encodeURIComponent(req.params.id)}`;
  try {
    const buffer = await QRCode.toBuffer(url);
    res.type('png');
    res.send(buffer);
  } catch (err) {
    res.status(500).send('QR code generation failed');
  }
});

app.get('/event/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'event.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
