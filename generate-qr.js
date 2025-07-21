const QRCode = require('qrcode');

const eventId = process.argv[2];
if (!eventId) {
  console.error('Usage: node generate-qr.js <eventId>');
  process.exit(1);
}

const url = `http://localhost:3000/event.html?event=${encodeURIComponent(eventId)}`;

QRCode.toFile(`qr-${eventId}.png`, url, { type: 'png' }, err => {
  if (err) throw err;
  console.log(`Generated qr-${eventId}.png for ${url}`);
});
