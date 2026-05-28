cd c:\Users\Admin\Desktop\PROJECTS\qr\quickdrop
npm install
npm start

In another terminal:
cd c:\Users\Admin\Desktop\PROJECTS\qr\quickdrop
ngrok http 3000

https://knarred-serviceable-arlo.ngrok-free.dev





# QuickDrop

QuickDrop is a QR-based file transfer app for sending files from a phone to a laptop over the local network or a public ngrok tunnel. The laptop shows a QR code, the phone opens the upload page, and uploaded files are immediately listed on the receiver screen.

## What It Does

- Generates a unique session and QR code for each receiver page load
- Opens a mobile upload page when the QR is scanned
- Uploads one file at a time through `multipart/form-data`
- Notifies the receiver in real time with Socket.IO
- Stores uploaded files in the local `uploads/` folder

## Project Files

- `server.js` - Express + Socket.IO server
- `public/index.html` - Receiver page shown on the laptop
- `public/upload.html` - Sender page shown on the phone
- `uploads/` - Saved files

## How to Run

> Important: run all commands from the `quickdrop/` folder, not from the parent `qr/` folder.

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm start
```

The server runs on port `3000`.

### 3. Start ngrok in another terminal

```bash
ngrok http 3000
```

For this workspace, the working public URL is:

```text
https://knarred-serviceable-arlo.ngrok-free.dev
```

## How To Use

1. Open the receiver page in your browser:

```text
https://knarred-serviceable-arlo.ngrok-free.dev
```

2. Scan the QR code with your phone.
3. The phone opens the upload page.
4. Choose a file and tap **Send File**.
5. The file appears instantly on the receiver page.

## Important Notes

- Use the ngrok URL when sending from a phone. The `localhost` address only works on the same machine.
- If ngrok restarts, the public URL can change.
- If the QR points to a local address, the phone cannot reach it.
- The current app sends one file at a time.

## API Endpoints

- `GET /` - Receiver page
- `GET /session` - Returns session ID, QR image, and phone upload URL
- `GET /upload/:id` - Phone upload page
- `POST /upload/:id` - Uploads a file

## Troubleshooting

If the phone page does not open:

1. Make sure `npm start` is running.
2. Make sure ngrok is running on port `3000`.
3. Open the receiver page from the ngrok URL, not `localhost`.
4. Scan a fresh QR code after each restart.

If uploads fail:

1. Check the browser console on the phone.
2. Check the server terminal for errors.
3. Confirm the file is within the size limit.

## Dependencies

```json
{
  "express": "^5.2.1",
  "multer": "^2.1.1",
  "qrcode": "^1.5.4",
  "socket.io": "^4.8.3",
  "uuid": "^13.0.0"
}
```

## License

ISC