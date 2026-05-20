const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

/* ✅ FIX CORS (VERY IMPORTANT) */
app.use(cors({
  origin: "*",
}));

/* ✅ ensure uploads folder exists */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ✅ multer setup */
const upload = multer({ dest: uploadDir });

/* ✅ TEST ROUTE (optional but useful) */
app.get("/", (req, res) => {
  res.send("✅ API is running");
});

/* ✅ MAIN UPLOAD ROUTE */
app.post("/upload", upload.single("video"), (req, res) => {
  console.log("📥 File received");

  if (!req.file) {
    return res.status(400).send("No file received");
  }

  const input = req.file.path;
  const output = path.join(uploadDir, `output-${Date.now()}.mp4`);

  /* ✅ FFmpeg command (your edit) */
  const command = `ffmpeg -i "${input}" -vf "eq=contrast=1.08:brightness=0.02:saturation=1.15,unsharp=5:5:0.8:3:3:0.4" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy -movflags +faststart "${output}"`;

  console.log("🚀 Running:", command);

  exec(command, (error, stdout, stderr) => {
    console.log(stderr);

    if (error) {
      console.error("❌ FFmpeg error:", error);

      // fallback: send original file so UI doesn't break
      return res.sendFile(path.resolve(input));
    }

    if (!fs.existsSync(output)) {
      console.log("❌ No output generated");

      // fallback again
      return res.sendFile(path.resolve(input));
    }

    const size = fs.statSync(output).size;
    console.log("📦 Output size:", size);

    if (size < 10000) {
      console.log("⚠️ Output too small — fallback");
      return res.sendFile(path.resolve(input));
    }

    /* ✅ send processed video */
    res.sendFile(path.resolve(output), (err) => {
      if (err) {
        console.error("❌ Send error:", err);
      }

      /* ✅ cleanup */
      try {
        fs.unlinkSync(input);
        fs.unlinkSync(output);
      } catch (cleanupErr) {
        console.log("Cleanup error:", cleanupErr);
      }
    });
  });
});

/* ✅ START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
``