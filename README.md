# seat-assginment-app

This is a simple MVP implementation of a seat assignment web application. Administrators can create events and configure the number of available seats for each event. A QR code is automatically generated for every event so that participants can access the event page and receive a unique seat number. The number does not change when the page is reloaded and will not duplicate for other users until the available numbers are exhausted.

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
3. Access the admin page at `http://localhost:3000/admin.html` and enter the password `1234` to create events and obtain QR codes.
4. Scan the QR code or open `http://localhost:3000/?event=<id>` to receive a seat number for that event.

## Future work
- Manage seating layout (4-seat or 6-seat blocks) via UI.
- Bind seat numbers to a seating chart with administrator configuration.
- Support reshuffling while remembering previous assignments.
- Deploy to Azure.
