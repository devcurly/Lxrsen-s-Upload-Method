const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

/* ✅ CORS (fix Chrome extension errors) */
app.use(cors({
  origin: "*"
}));

/* ✅ uploads folder */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ✅ multer */
const upload = multer({ dest: uploadDir });

/* ✅ test route */
app.get("/", (req, res) => {
  res.send("✅ API is running");
});

/* ✅ upload route */
app.post("/upload", upload.single("video"), (req, res) => {
  console.log("📥 File received");

  if (!req.file) {
    return res.status(400).send("No file");
  }

  const input = req.file.path;
  const output = path.join(uploadDir, `output-${Date.now()}.mp4`);

  /* ✅ FAST FFmpeg (FIXED VERSION) */
  const command = `ffmpeg -i "${input}" -vf "eq=contrast=1.08:brightness=0.02:saturation=1.15,unsharp=5:5:0.8:3:3:0.4" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "${output}"`;

  console.log("🚀 Running:", command);

  exec(command, (error, stdout, stderr) => {
    console.log(stderr);

    /* ❌ FFmpeg failed */
    if (error) {
      console.error("❌ FFmpeg error:", error);

      // fallback (send original so app doesn't break)
      return res.sendFile(path.resolve(input));
    }

    /* ❌ no output */
    if (!fs.existsSync(output)) {
      console.log("❌ No output file");

      return res.sendFile(path.resolve(input));
    }

    const size = fs.statSync(output).size;
    console.log("📦 Output size:", size);

    /* ❌ invalid output */
    if (size < 10000) {
      console.log("⚠️ Output too small");

      return res.sendFile(path.resolve(input));
    }

    /* ✅ send processed file */
    res.sendFile(path.resolve(output), (err) => {
      if (err) {
        console.error("❌ Send error:", err);
      }

      /* ✅ cleanup */
      try {
        fs.unlinkSync(input);
        fs.unlinkSync(output);
      } catch (e) {
        console.log("cleanup error:", e);
      }
    });
  });
});

/* ✅ start server */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});