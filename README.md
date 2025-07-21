# seat-assginment-app

This is a simple MVP implementation of a seat assignment web application. Scanning a QR code that points to this app will display a unique number for each participant. The number does not change when the page is reloaded and will not duplicate for other users until the available numbers are exhausted.

## Requirements
- Each user receives a random seat number that is unique within the event.
- Reloading the page does not change the assigned number.

## Running locally
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the server
   ```bash
   npm start
   ```
3. Access `http://localhost:3000?eventId=myEvent` in your browser. Replace
   `myEvent` with your event identifier. A seat number from that event's pool will
   be displayed and remembered on reload.
4. Assigned numbers are stored in `assigned_numbers.json` so they persist across
   server restarts.

## Future work
- Manage seating layout (4-seat or 6-seat blocks) via UI.
- Bind seat numbers to a seating chart with administrator configuration.
- Support reshuffling while remembering previous assignments.
- Deploy to Azure.
