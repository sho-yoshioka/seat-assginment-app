const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'));

let assignedNumbers = new Set();
let maxNumber = 100; // maximum seats for now

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
