/* ============================================================
   דף נחיתה — ברית | משפחת נדיר
   ============================================================ */

/* ============================================================
   ⚙️  קונפיגורציה — כל מה שצריך לעדכן נמצא כאן ורק כאן
   ============================================================ */
const CONFIG = {

  /* --- Google Apps Script --- */
  // ה-URL שמתקבל אחרי Deploy של ה-Web App (מסתיים ב-/exec)
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxux6FUGVrqjjvuScmnUvaxySfWNvEqIZ5JVmfxXr_XDZe5GmWRrQW5S702VgbgokWA/exec',
  // חייב להיות זהה לערך UPLOAD_TOKEN שב-Code.gs
  UPLOAD_TOKEN: 'brit-nadir-2026',

  /* --- פרטי האירוע --- */
  VENUE_NAME:     '',   // למשל: 'אולמי הגן הקסום'  (ריק = נשאר ה-placeholder בדף)
  VENUE_ADDRESS:  '',   // כתובת מלאה לניווט, למשל: 'הרצל 12, פתח תקווה'
  RECEPTION_TIME: '16:30',
  CEREMONY_TIME:  '17:00',

  /* --- ניווט (אופציונלי) --- */
  // אם משאירים ריק — הקישור נבנה אוטומטית מ-VENUE_ADDRESS.
  // אפשר להדביק כאן קישור מדויק שהעתקתם מהאפליקציה עצמה.
  WAZE_URL:        '',
  GOOGLE_MAPS_URL: '',

  /* --- מתנה --- */
  // ⚠️ חשוב: להדביק כאן את "קישור התשלום האישי" מתוך האפליקציה בלבד
  //    (ראו הוראות ב-README). קישור כזה פותח בנייד ישירות את מסך ההעברה.
  BIT_LINK:   'https://www.bitpay.co.il/app/me/8D1797DF-6868-41EF-881F-DEE02E1C8FA9A8BF',
  GIFT_PHONE: '',   // מספר לגיבוי/העתקה, למשל: '050-1234567'

  /* --- מגבלות העלאה --- */
  MAX_FILE_MB: 15,
  MAX_FILES: 20,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'heic', 'heif'],
};

/* ============================================================
   מצב פנימי
   ============================================================ */
const state = {
  files: [],        // { file, previewUrl, id }
  isUploading: false,
};

let fileIdCounter = 0;

/* ============================================================
   עזרים
   ============================================================ */
const $ = (id) => document.getElementById(id);

function show(el) { if (el) el.hidden = false; }
function hide(el) { if (el) el.hidden = true; }

function getExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(name || '');
  return match ? match[1].toLowerCase() : '';
}

/* ============================================================
   1. פרטי האירוע
   ============================================================ */
function fillEventDetails() {
  if (CONFIG.VENUE_NAME) {
    $('venue-name').textContent = CONFIG.VENUE_NAME;
  }

  // הכתובת מוצגת כשורה נפרדת רק אם היא שונה משם המקום
  if (CONFIG.VENUE_ADDRESS && CONFIG.VENUE_ADDRESS !== CONFIG.VENUE_NAME) {
    const addressEl = $('venue-address');
    addressEl.textContent = CONFIG.VENUE_ADDRESS;
    show(addressEl);
  } else if (!CONFIG.VENUE_NAME && CONFIG.VENUE_ADDRESS) {
    $('venue-name').textContent = CONFIG.VENUE_ADDRESS;
  }

  if (CONFIG.RECEPTION_TIME) $('reception-time').textContent = CONFIG.RECEPTION_TIME;
  if (CONFIG.CEREMONY_TIME)  $('ceremony-time').textContent  = CONFIG.CEREMONY_TIME;
}

/* ============================================================
   2. ניווט
   ============================================================ */
function setupNavigation() {
  const wazeBtn = $('waze-btn');
  const mapsBtn = $('maps-btn');
  const destination = CONFIG.VENUE_ADDRESS || CONFIG.VENUE_NAME;

  const wazeUrl = CONFIG.WAZE_URL ||
    (destination ? `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes` : '');

  const mapsUrl = CONFIG.GOOGLE_MAPS_URL ||
    (destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : '');

  applyNavLink(wazeBtn, wazeUrl);
  applyNavLink(mapsBtn, mapsUrl);

  // אין עדיין יעד — מסמנים את הכפתורים כלא-פעילים במקום לשלוח לשומקום
  const navNote = $('nav-note');
  if (!wazeUrl && !mapsUrl) show(navNote); else hide(navNote);
}

function applyNavLink(btn, url) {
  if (!btn) return;

  if (url) {
    btn.href = url;
    btn.target = '_blank';
    btn.removeAttribute('aria-disabled');
  } else {
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
  }
}

/* ============================================================
   3. מתנה — Bit
   ------------------------------------------------------------
   הקישור הוא Universal Link של האפליקציה. בנייד עם האפליקציה
   מותקנת, מערכת ההפעלה חוטפת את הקישור ופותחת ישירות את מסך
   העברת התשלום. לכן במכוון אין כאן target="_blank" — פתיחת טאב
   חדש שוברת את המנגנון בחלק מהדפדפנים בנייד ומובילה לדף ווב.
   ============================================================ */
function setupGift() {
  applyGiftLink($('bit-btn'), CONFIG.BIT_LINK);

  // בלי קישור — הכפתור עמום וההערה מסבירה מה למלא
  const setupNote = $('gift-setup-note');
  if (!CONFIG.BIT_LINK) {
    setupNote.textContent =
      'להפעלת הכפתור: מלאו את BIT_LINK בקובץ script.js (הסבר ב-README, שלב 3).';
    show(setupNote);
  } else {
    hide(setupNote);
  }

  if (CONFIG.GIFT_PHONE) {
    $('gift-phone-value').textContent = CONFIG.GIFT_PHONE;
    show($('gift-fallback'));
  } else {
    hide($('gift-fallback'));
  }

  setupCopyPhone();
}

function applyGiftLink(btn, url) {
  if (!btn) return;

  if (url) {
    btn.href = url;
    btn.removeAttribute('aria-disabled');
  } else {
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
  }
}

function setupCopyPhone() {
  const btn      = $('copy-phone-btn');
  const feedback = $('copy-feedback');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const phone = CONFIG.GIFT_PHONE;
    if (!phone) return;

    const copied = await copyToClipboard(phone);
    feedback.textContent = copied ? 'המספר הועתק ✓' : 'לא הצלחנו להעתיק — אפשר לסמן ידנית';
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // ממשיכים ל-fallback
  }

  // fallback לדפדפנים ישנים / הקשר לא מאובטח
  try {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(temp);
    return ok;
  } catch (err) {
    return false;
  }
}

/* ============================================================
   4. בחירת תמונות + ולידציה
   ============================================================ */
function setupUpload() {
  $('file-input').addEventListener('change', handleFileSelection);
  $('upload-btn').addEventListener('click', startUpload);
  $('upload-more-btn').addEventListener('click', resetToForm);
}

function handleFileSelection(event) {
  const picked = Array.from(event.target.files || []);
  const errors = [];

  picked.forEach((file) => {
    if (state.files.length >= CONFIG.MAX_FILES) {
      errors.push(`אפשר להעלות עד ${CONFIG.MAX_FILES} תמונות בבת אחת.`);
      return;
    }

    const problem = validateFile(file);
    if (problem) {
      errors.push(problem);
      return;
    }

    state.files.push({
      id: ++fileIdCounter,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  });

  // מאפשר לבחור שוב את אותו קובץ אחרי הסרה
  event.target.value = '';

  // הודעות זהות מוצגות פעם אחת בלבד
  showErrors(Array.from(new Set(errors)));
  renderThumbs();
}

function validateFile(file) {
  const ext = getExtension(file.name);
  const typeOk = CONFIG.ALLOWED_TYPES.includes((file.type || '').toLowerCase());
  const extOk  = CONFIG.ALLOWED_EXTENSIONS.includes(ext);

  // HEIC מגיע לפעמים בלי MIME — לכן הסיומת מספיקה כגיבוי
  if (!typeOk && !extOk) {
    return `"${file.name}" אינו קובץ תמונה נתמך. אפשר להעלות JPG או PNG בלבד.`;
  }

  const maxBytes = CONFIG.MAX_FILE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    return `"${file.name}" גדול מדי (${sizeMb}MB). הגודל המרבי הוא ${CONFIG.MAX_FILE_MB}MB.`;
  }

  if (file.size === 0) {
    return `"${file.name}" נראה ריק ולא ניתן להעלאה.`;
  }

  return null;
}

function showErrors(messages) {
  const el = $('error-msg');

  if (!messages.length) {
    hide(el);
    el.textContent = '';
    return;
  }

  el.textContent = '';
  messages.forEach((msg, index) => {
    if (index > 0) el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(msg));
  });
  show(el);
}

function renderThumbs() {
  const list = $('thumbs');
  list.textContent = '';

  state.files.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'thumb';

    const img = document.createElement('img');
    img.src = entry.previewUrl;
    img.alt = `תצוגה מקדימה: ${entry.file.name}`;
    img.loading = 'lazy';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'thumb__remove';
    removeBtn.setAttribute('aria-label', `הסרת ${entry.file.name}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeFile(entry.id));

    li.append(img, removeBtn);
    list.appendChild(li);
  });

  // כפתור ההעלאה מופיע רק כשיש מה להעלות
  const uploadBtn = $('upload-btn');
  if (state.files.length) {
    $('upload-btn-text').textContent =
      state.files.length === 1 ? 'העלאת התמונה' : `העלאת ${state.files.length} התמונות`;
    show(uploadBtn);
  } else {
    hide(uploadBtn);
  }
}

function removeFile(id) {
  const index = state.files.findIndex((entry) => entry.id === id);
  if (index === -1) return;

  URL.revokeObjectURL(state.files[index].previewUrl);
  state.files.splice(index, 1);
  renderThumbs();
}

/* ============================================================
   5. המרה ל-Base64 והעלאה
   ============================================================ */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('שגיאה בקריאת הקובץ'));
        return;
      }
      resolve(result.slice(commaIndex + 1)); // חיתוך "data:image/jpeg;base64,"
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsDataURL(file);
  });
}

async function sendToWebApp(payload) {
  // Content-Type חייב להיות text/plain: Apps Script לא עונה ל-CORS preflight,
  // ו-application/json היה הופך את הבקשה ל-preflighted ומפיל אותה.
  const response = await fetch(CONFIG.WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`השרת החזיר שגיאה (${response.status})`);
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error('תשובה לא צפויה מהשרת');
  }

  if (!data.ok) {
    throw new Error(data.error || 'ההעלאה נכשלה');
  }

  return data;
}

async function uploadSingleFile(entry, guestName) {
  const base64 = await fileToBase64(entry.file);

  const payload = {
    token: CONFIG.UPLOAD_TOKEN,
    fileName: entry.file.name,
    mimeType: entry.file.type || 'image/jpeg',
    guestName,
    data: base64,
  };

  try {
    return await sendToWebApp(payload);
  } catch (err) {
    // ניסיון חוזר אחד — רשתות סלולריות באולם נוטות ליפול פעם אחת
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return sendToWebApp(payload);
  }
}

async function startUpload() {
  if (state.isUploading || !state.files.length) return;

  if (!CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
    showErrors(['ההעלאה עדיין לא הופעלה. יש להגדיר את כתובת ה-Web App בקובץ script.js.']);
    return;
  }

  setUploadingState(true);
  showErrors([]);

  const guestName = ($('guest-name').value || '').trim();
  const total = state.files.length;
  let completed = 0;

  try {
    for (const entry of state.files) {
      updateProgress(completed, total);
      await uploadSingleFile(entry, guestName);
      completed += 1;
    }

    updateProgress(completed, total);
    showSuccess();
  } catch (err) {
    setUploadingState(false);
    const uploadedNote = completed
      ? ` ${completed} מתוך ${total} תמונות כבר הועלו — אפשר להסיר אותן ולנסות שוב עם השאר.`
      : '';
    showErrors([`ההעלאה נתקלה בבעיה: ${err.message}. נסו שוב בעוד רגע.${uploadedNote}`]);
  }
}

function updateProgress(completed, total) {
  const percent = Math.round((completed / total) * 100);
  const current = Math.min(completed + 1, total);

  $('progress-status').textContent = completed >= total
    ? 'כמעט סיימנו…'
    : `מעלים תמונה ${current} מתוך ${total}…`;

  $('progress-fill').style.width = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(percent));
}

function setUploadingState(isUploading) {
  state.isUploading = isUploading;

  const uploadBtn = $('upload-btn');
  const fileLabel = $('file-label');

  uploadBtn.disabled = isUploading;
  uploadBtn.setAttribute('aria-busy', String(isUploading));

  if (isUploading) {
    hide(uploadBtn);
    hide(fileLabel);
    show($('progress'));
  } else {
    show(uploadBtn);
    show(fileLabel);
    hide($('progress'));
  }
}

/* ============================================================
   6. מצב הצלחה / איפוס
   ============================================================ */
function showSuccess() {
  clearSelection();
  state.isUploading = false;
  hide($('upload-form-state'));
  show($('success-state'));
  $('success-state').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearSelection() {
  state.files.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
  state.files = [];
  $('thumbs').textContent = '';
  $('file-input').value = '';
}

function resetToForm() {
  clearSelection();
  showErrors([]);
  setUploadingState(false);
  hide($('upload-btn'));
  $('progress-fill').style.width = '0%';
  $('progress-status').textContent = '';

  hide($('success-state'));
  show($('upload-form-state'));
  $('upload-form-state').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ============================================================
   7. אנימציית כניסה
   ============================================================ */
function setupReveal() {
  const items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}

/* ============================================================
   אתחול
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  fillEventDetails();
  setupNavigation();
  setupGift();
  setupUpload();
  setupReveal();
});
