const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 11 * 1024 * 1024 * 1024, // 11GB buffer for socket messages
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  }
});

const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");

/* ========== Ensure uploads directory exists ========== */
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("Created uploads/ directory");
}

// Increase body size limits to handle large files (10GB+)
app.use(express.json({ limit: '11gb' }));
app.use(express.urlencoded({ limit: '11gb', extended: true }));
app.use(express.raw({ limit: '11gb' }));

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} — Content-Length: ${req.headers['content-length']} — Content-Type: ${req.headers['content-type']}`);
  next();
});

app.use(express.static("public"));
app.use("/uploads", express.static(UPLOAD_DIR));

/* ================= FILE UPLOAD CONFIG ================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 11 * 1024 * 1024 * 1024 } // 11GB limit
});

/* ================= ROUTES ================= */

// Home — receiver page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Generate QR + session
app.get("/session", async (req, res) => {
  try {
    const sessionId = uuidv4();
    const url = `${req.protocol}://${req.get("host")}/upload/${sessionId}`;
    const qrCode = await QRCode.toDataURL(url);

    res.json({ sessionId, qr: qrCode, url });
  } catch (err) {
    console.error("QR generation failed:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// Upload page (phone view)
app.get("/upload/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});

// Handle file upload — callback style to catch multer errors cleanly
app.post("/upload/:id", (req, res) => {
  res.setTimeout(3600000); // 1 hour timeout for very large files
  
  upload.single("file")(req, res, function (err) {
    // Multer errors (size limit, unexpected field, etc.)
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err.code, err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Maximum size is 50 MB." });
      }
      return res.status(400).json({ error: err.message });
    }

    // Any other unexpected error
    if (err) {
      console.error("Upload error:", err.message, err.stack);
      return res.status(500).json({ error: "Upload failed on server: " + err.message });
    }

    const sessionId = req.params.id;

    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file received" });
    }

    console.log("File uploaded:", req.file.filename, "—", (req.file.size / 1024).toFixed(1), "KB", "—", req.file.mimetype);

    // Parse original name from stored filename (Date.now()-originalname)
    const originalName = req.file.filename.replace(/^\d+-/, "");

    // Push file info to every socket in this session room
    io.to(sessionId).emit("file-received", {
      filename: req.file.filename,
      originalName: originalName,
      size: req.file.size
    });

    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename
    });
  });
});

// Safety net — catch any unhandled errors from any route
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ================= SOCKET ================= */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-session", (sessionId) => {
    socket.join(sessionId);
    console.log("Joined session:", sessionId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ================= START SERVER ================= */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`QuickDrop running at http://localhost:${PORT}`);
});

// Set higher timeout for large file uploads (1 hour)
server.timeout = 3600000; // 1 hour
server.keepAliveTimeout = 65000;