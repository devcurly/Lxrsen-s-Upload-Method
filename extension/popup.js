let file = null;
let busy = false;

const drop = document.getElementById('drop');
const fi = document.getElementById('fi');
const frow = document.getElementById('frow');
const fname = document.getElementById('fname');
const fmeta = document.getElementById('fmeta');
const prow = document.getElementById('prow');
const pfill = document.getElementById('pfill');
const ppct = document.getElementById('ppct');
const goBtn = document.getElementById('goBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const dot = document.getElementById('dot');
const stxt = document.getElementById('stxt');
const sfx = document.getElementById('sfx');

const MAX_SIZE = 30 * 1024 * 1024;
const UPLOAD_URL = 'https://lxrsen-upload-method.onrender.com/upload';

function clk() {
  try { sfx.currentTime = 0; sfx.volume = 0.05; sfx.play(); } catch (e) {}
}

function fmt(b) {
  if (b < 1048576) return (b / 1024).toFixed(1) + ' kb';
  return (b / 1048576).toFixed(1) + ' mb';
}

function st(msg, cls) {
  stxt.textContent = msg;
  dot.className = 'dot' + (cls ? ' ' + cls : '');
}

function pick(f) {
  if (!f) return;
  if (!f.type.startsWith('video/')) {
    drop.classList.add('error');
    st('unsupported file type', 'err');
    setTimeout(() => drop.classList.remove('error'), 350);
    return;
  }
  if (f.size > MAX_SIZE) {
    drop.classList.add('error');
    st('max 30MB', 'err');
    setTimeout(() => drop.classList.remove('error'), 1000);
    return;
  }
  file = f;
  drop.classList.add('has-file');
  fname.textContent = f.name;
  fmeta.textContent = fmt(f.size);
  frow.classList.add('show');
  st('ready to process', 'ok');
  clk();
  const v = document.createElement('video');
  v.src = URL.createObjectURL(f);
  v.onloadedmetadata = function () {
    fmeta.textContent = fmt(f.size) + ' \u00b7 ' + Math.round(v.duration) + 's';
  };
}

function clearFile() {
  file = null;
  fi.value = '';
  frow.classList.remove('show');
  drop.classList.remove('has-file');
  prow.classList.remove('show');
  pfill.style.width = '0%';
  ppct.textContent = '0%';
  goBtn.disabled = false;
  goBtn.textContent = 'Process';
  busy = false;
  st('waiting for file', '');
}

async function go() {
  if (!file) {
    drop.classList.add('error');
    st('no file selected', 'err');
    setTimeout(() => drop.classList.remove('error'), 350);
    return;
  }
  if (busy) return;
  busy = true;
  goBtn.disabled = true;
  prow.classList.add('show');
  pfill.style.width = '0%';
  ppct.textContent = '0%';
  st('uploading...', 'run');
  clk();

  try {
    const form = new FormData();
    form.append('video', file);

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });

    if (!res.ok) throw new Error('Server error');

    pfill.style.width = '70%';
    ppct.textContent = '70%';
    st('enhancing...', 'run');

    const blob = await res.blob();
    if (!blob || blob.size === 0) throw new Error('Invalid response');

    pfill.style.width = '100%';
    ppct.textContent = '100%';
    st('done.', 'ok');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boosted.mp4';
    a.click();

    goBtn.textContent = 'Again';

  } catch (err) {
    console.error(err);
    st('failed', 'err');
    pfill.style.width = '0%';
    ppct.textContent = '0%';
  }

  busy = false;
  goBtn.disabled = false;
}

drop.addEventListener('click', () => { fi.click(); clk(); });

fi.addEventListener('change', () => {
  const f = fi.files[0];
  if (f) pick(f);
});

drop.addEventListener('dragover', (e) => {
  e.preventDefault();
  drop.classList.add('dragover');
});

drop.addEventListener('dragleave', () => {
  drop.classList.remove('dragover');
});

drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) pick(f);
});

goBtn.addEventListener('click', go);

resetBtn.addEventListener('click', () => { clearFile(); clk(); });

if (clearBtn) {
  clearBtn.addEventListener('click', clearFile);
}
