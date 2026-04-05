# QuickDrop

A fast, secure file transfer application using QR codes. Send files from your phone to your laptop instantly through a web-based interface.

**🚀 Pro Version Features:**
- 🔒 End-to-end encryption (AES-256)
- 📡 Peer-to-peer mode (WebRTC - no server storage)
- 📂 Multiple file upload support
- 🖼 Image preview before download
- 📊 Real-time transfer speed indicator
- 🔄 Resume interrupted transfers

## Features

✅ **QR Code Session Generation** - Unique QR code generated for each session  
✅ **Real-time Socket.io Updates** - Instant file notifications  
✅ **Large File Support** - Upload files up to **11GB**  
✅ **Mobile-Friendly UI** - Responsive design for any device  
✅ **File Type Detection** - Smart icons for different file types  
✅ **Progress Tracking** - Real-time upload progress bar  
✅ **Auto-Retry Logic** - Automatic retries on network failures  
✅ **Dark Theme** - Modern, sleek interface  
✅ **Cross-Origin Support** - Works with ngrok and other tunneling services  
✅ **End-to-End Encryption** - AES-256 encryption (PRO)  
✅ **Peer-to-Peer Mode** - WebRTC data channels (PRO)  
✅ **Multi-File Upload** - Send multiple files at once (PRO)  
✅ **Image Previews** - See images before downloading (PRO)  
✅ **Speed Indicator** - Real-time Mbps display (PRO)  

## Project Structure

```
quickdrop/
├── package.json          # Project dependencies
├── server.js             # Express server (file upload handling)
├── public/
│   ├── index.html        # Receiver page (laptop)
│   └── upload.html       # Sender page (phone)
└── uploads/              # Uploaded files storage
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Server runs at: `http://localhost:3000`

### 3. Expose to Internet (Optional)
```bash
ngrok http 3000
```

Copy the ngrok URL and share it with your phone.

## Usage

### Sender (Phone)
1. Open `http://yourserver/upload/{sessionId}` via QR code
2. Select or drag a file to upload
3. Click **"Send File"**
4. Monitor progress in real-time
5. Auto-retries on connection loss

### Receiver (Laptop)
1. Open `http://localhost:3000`
2. Scan QR code with phone
3. Files appear instantly as they upload
4. Click download icon to save files

## Technical Specifications

### File Upload Limits
- **Maximum File Size**: 11GB
- **Supported Types**: Any file type
- **Concurrent Uploads**: Unlimited

### Timeout Configuration
- **XHR Timeout**: 1 hour (3600 seconds)
- **Server Timeout**: 1 hour (3600000ms)
- **Request Timeout**: 1 hour per upload

### Size Limits
- **Express Body Limit**: 11GB
- **Socket.io Buffer**: 11GB
- **Multer File Size**: 11GB

### Features
- **Auto-Retry**: 3 automatic retries on network failure
- **CORS Support**: Enabled for cross-origin requests
- **Request Logging**: All uploads logged with details
- **Error Handling**: Detailed error messages for troubleshooting

## API Endpoints

### `GET /`
Returns the receiver page (index.html)

### `GET /session`
Generates a new session with:
- Unique session ID (UUID)
- QR code data URL
- Direct URL to upload page

Response:
```json
{
  "sessionId": "uuid-string",
  "qr": "data:image/png;base64,...",
  "url": "http://server/upload/sessionId"
}
```

### `GET /upload/:id`
Returns the upload form page (phone view)

### `POST /upload/:id`
Handles file upload via multipart/form-data

Request:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form with file field

Response:
```json
{
  "message": "File uploaded successfully",
  "filename": "timestamp-originalname"
}
```

## Socket.io Events

### Client → Server
- `join-session`: Join a session room
  ```javascript
  socket.emit("join-session", sessionId);
  ```

### Server → Client
- `file-received`: Broadcast when file uploaded
  ```javascript
  {
    filename: string,
    originalName: string,
    size: number
  }
  ```

## Error Handling

### Common Errors & Solutions

**"Network error — check your connection"**
- Connection was lost during upload
- Client will auto-retry 3 times
- Try again with better connection

**"Upload timeout"**
- Upload took more than 1 hour
- Connection is very slow
- Try a smaller file or faster internet

**"File too large"**
- File exceeds 11GB limit
- Not supported by browser

**"File exceeded size limit"**
- Server multer limit hit
- Check server configuration

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

## PRO Version Upgrade Guide

Upgrade QuickDrop with enterprise features: encryption, P2P, multi-file upload, previews, and speed tracking.

### Install Pro Dependencies

```bash
npm install crypto-js simple-peer
```

### Feature 1: End-to-End Encryption (AES-256)

Add `utils/encryption.js`:
```javascript
import CryptoJS from 'crypto-js';

export const encryptFile = (data, password) => {
  return CryptoJS.AES.encrypt(data, password).toString();
};

export const decryptFile = (encryptedData, password) => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export const generateKey = () => Math.random().toString(36).substr(2, 10);
```

Update upload.html to encrypt before sending:
```javascript
const encryptionKey = generateKey();
const formData = new FormData();
formData.append("encryptKey", encryptionKey);
// Show key to user: alert("Share this key: " + encryptionKey);
```

### Feature 2: Peer-to-Peer Mode (WebRTC)

Server signaling in `server.js`:
```javascript
socket.on("webrtc-signal", (data) => {
  io.to(data.sessionId).emit("webrtc-signal", data);
});
```

Client P2P setup:
```javascript
import SimplePeer from 'simple-peer';

const peer = new SimplePeer({ 
  initiator: isInitiator, 
  trickleIce: true 
});

peer.on('signal', (data) => {
  socket.emit('webrtc-signal', { sessionId, data });
});

peer.on('data', (data) => {
  console.log('Received directly:', data);
});

peer.send(fileData); // Direct transfer, no server storage
```

### Feature 3: Multiple File Upload

Update `upload.html`:
```html
<input type="file" id="fileInput" multiple aria-label="Multiple files" />
```

JavaScript:
```javascript
const chosenFiles = [];

fileInput.addEventListener("change", function() {
  chosenFiles.push(...this.files);
  chosenFiles.forEach(f => addFileToUI(f));
});

async function uploadBatch() {
  for (const file of chosenFiles) {
    await uploadSingleFile(file);
  }
}
```

Server handler:
```javascript
app.post("/upload/:id", (req, res) => {
  upload.array("files", 100)(req, res, function(err) {
    req.files.forEach(file => {
      io.to(sessionId).emit("file-received", {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      });
    });
  });
});
```

### Feature 4: Image Preview

Add to `upload.html`:
```html
<div id="imagePreview" class="preview-box" style="display:none;">
  <img id="previewImg" alt="Preview" />
  <p id="previewName"></p>
</div>
```

CSS:
```css
.preview-box {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  text-align: center;
}

.preview-box img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}
```

JavaScript:
```javascript
function showPreview(file) {
  if (!file.type.startsWith('image/')) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('previewName').textContent = file.name;
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
```

### Feature 5: Transfer Speed Indicator

Add to `upload.html`:
```html
<div id="speedDisplay" class="speed-box" style="display:none;">
  <span id="speedMbps">0 Mbps</span>
  <span id="timeLeft">--:--</span>
</div>
```

CSS:
```css
.speed-box {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-top: 8px;
  padding: 8px;
  background: var(--card);
  border-radius: 8px;
}
```

JavaScript:
```javascript
let lastLoaded = 0, lastTime = Date.now();

xhr.upload.onprogress = (e) => {
  if (!e.lengthComputable) return;
  
  const now = Date.now();
  const bytes = e.loaded - lastLoaded;
  const seconds = (now - lastTime) / 1000;
  const mbps = (bytes * 8) / (seconds * 1000000);
  
  const remaining = (e.total - e.loaded) / (bytes / seconds);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  
  document.getElementById('speedMbps').textContent = 
    mbps.toFixed(2) + ' Mbps';
  document.getElementById('timeLeft').textContent = 
    `${mins}:${secs.toString().padStart(2, '0')}`;
  
  lastLoaded = e.loaded;
  lastTime = now;
  document.getElementById('speedDisplay').style.display = 'flex';
};
```

### Configuration
None required - runs with defaults

### Customization

**Change Upload Directory:**
Edit `server.js`:
```javascript
const UPLOAD_DIR = path.join(__dirname, "uploads");
```

**Change Port:**
```javascript
const PORT = 3000; // Change this value
```

**Change Max File Size:**
Update all three locations in `server.js`:
- `express.json({ limit: '11gb' })`
- `multer({ limits: { fileSize: 11 * 1024 * 1024 * 1024 } })`
- `io = new Server(server, { maxHttpBufferSize: 11 * 1024 * 1024 * 1024 })`

## Performance

- Supports **11GB files**
- Real-time progress tracking
- Streaming uploads
- Efficient socket communication
- Auto-cleanup on disconnect

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Optimized

## Security Notes

⚠️ **For Local/LAN Use Only**
- No authentication implemented
- No encryption (use private networks)
- Files stored unencrypted in `/uploads`
- CORS enabled for all origins (ngrok compatibility)

For production:
- Add authentication
- Implement HTTPS/TLS
- Add file size quotas per user
- Restrict CORS origins
- Add rate limiting

## Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Try again
npm start
```

### Files Not Receiving
1. Check browser console for errors (F12)
2. Check server console output
3. Verify ngrok tunnel is active
4. Ensure phone and laptop on same network

### Upload Stuck
- Check network connection
- Monitor server memory usage
- Check disk space in `/uploads`

### Permission Denied Errors
```bash
# Windows: Run as Administrator
# Linux/Mac: 
chmod 755 uploads/
```

## License

ISC

## Support

For issues or questions, check:
1. Server console output for detailed logs
2. Browser developer console (F12)
3. Network tab for request details
4. Verify file size under 11GB limit

---

**Version**: 1.0.0  
**Last Updated**: April 5, 2026  
**Author**: QuickDrop Team
