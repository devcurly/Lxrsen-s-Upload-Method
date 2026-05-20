let file;

const drop = document.getElementById("drop");
const input = document.getElementById("fileInput");
const status = document.getElementById("status");
const bar = document.getElementById("bar");
const video = document.getElementById("preview");
const sound = document.getElementById("sound");

// SOUND
function play() {
  if (!sound) return;
  sound.currentTime = 0;
  sound.volume = 0.05;
  sound.play().catch(() => {});
}

// FILE HANDLING (30MB LIMIT)
function handleFile(f) {
  const maxSize = 30 * 1024 * 1024;

  if (f.size > maxSize) {
    status.innerText = "❌ Max 30MB";
    drop.classList.add("error");

    setTimeout(() => {
      drop.classList.remove("error");
    }, 1000);

    return;
  }

  file = f;
  status.innerText = "✅ Loaded";

  video.src = URL.createObjectURL(file);
  video.style.display = "block";
}

// CLICK
drop.onclick = () => {
  input.click();
  play();
};

// FILE SELECT
input.onchange = () => {
  const f = input.files[0];
  if (!f) return;
  handleFile(f);
};

// DRAG
drop.addEventListener("dragover", (e) => e.preventDefault());

drop.addEventListener("dragenter", (e) => {
  e.preventDefault();
  drop.classList.add("drag");
});

drop.addEventListener("dragleave", () => {
  drop.classList.remove("drag");
});

drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("drag");

  const f = e.dataTransfer.files[0];
  if (!f) return;

  handleFile(f);
});

// ✅ PROCESS (FULLY FIXED)
document.getElementById("upload").onclick = async () => {
  play();

  if (!file) {
    status.innerText = "❌ No file";
    return;
  }

  bar.style.width = "20%";
  status.innerText = "Uploading...";

  try {
    const form = new FormData();
    form.append("video", file);

    const res = await fetch("https://lxrsen-upload-method.onrender.com/upload", {
      method: "POST",
      body: form
    });

    console.log("Response:", res);

    if (!res.ok) {
      throw new Error("Server error");
    }

    status.innerText = "Enhancing...";
    bar.style.width = "70%";

    const blob = await res.blob();

    console.log("Blob size:", blob.size);

    if (!blob || blob.size === 0) {
      throw new Error("Invalid video returned");
    }

    const url = URL.createObjectURL(blob);

    video.src = url;
    video.style.display = "block";

    bar.style.width = "100%";
    status.innerText = "✅ Done";

    // DOWNLOAD
    const a = document.createElement("a");
    a.href = url;
    a.download = "boosted.mp4";
    a.click();

  } catch (err) {
    console.error("ERROR:", err);

    status.innerText = "❌ Failed";
    bar.style.width = "0%";
  }
};