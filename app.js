/* =====================================================
   KONFIGURASI  —  ISI BAGIAN INI DULU
   1. SCRIPT_URL : URL "Web app" Google Apps Script (berakhiran /exec)
   2. SECRET     : kata rahasia, HARUS SAMA dengan SECRET di Code.gs
   Salin nilai SCRIPT_URL, SECRET, dan PELAMAR dari app.js lama Anda.
   ===================================================== */
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeWwHbdfSf7-etWDiwVJFkNCw5noRGzlzlbjY2o2HIt86jcRQCrhkkXrfHTQ71nnIs/exec";      // <-- tempel URL /exec
   const SECRET     = "fazli-lamaran-2026";  // <-- samakan dengan Code.gs

/* Data diri untuk cover letter dan panel profil */
const PELAMAR = {
  nama: "Muhamad Fazli",
  telepon: "+6281277407483",
  email: "muhamadfazlii107@gmail.com"
};

/* Target jumlah lamaran per minggu (untuk lingkaran progres) */
const TARGET_MINGGUAN = 10;

/* ---------- Template cover letter ----------
   {{company}} dan {{position}} diganti otomatis. */
const TEMPLATES = {
  webdev:
`Yth. Tim HRD {{company}},

Dengan hormat,
  
Saya {{nama}}, bermaksud melamar posisi {{position}} di {{company}}.
  
Saya memiliki latar belakang dan keterampilan yang relevan, cepat beradaptasi dengan lingkungan kerja baru, serta berkomitmen untuk memberikan kontribusi positif bagi pertumbuhan perusahaan. Saya juga terbiasa bekerja secara mandiri maupun dalam tim dengan tingkat kedisiplinan dan tanggung jawab yang tinggi.
  
Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya melampirkan Daftar Riwayat Hidup (CV) beserta dokumen pendukung lainnya. Besar harapan saya untuk diberikan kesempatan mengikuti tahapan seleksi selanjutnya.
  
Terima kasih atas perhatiannya.
  
Hormat saya,
{{nama}}
{{telepon}}`,

  admin:
`Yth. Tim HRD {{company}},

Dengan hormat,

Saya {{nama}}, bermaksud melamar posisi {{position}} di {{company}}.

Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya melampirkan Daftar Riwayat Hidup (CV) beserta dokumen pendukung lainnya. Besar harapan saya untuk diberikan kesempatan mengikuti tahapan seleksi selanjutnya.

Terima kasih atas perhatiannya.

Hormat saya,
{{nama}}
{{telepon}} | {{email}}`,

  general:
`Yth. Tim HRD {{company}},

Dengan hormat,

Saya {{nama}}, tertarik melamar posisi {{position}} di {{company}}. Saya memiliki semangat belajar yang tinggi, tanggung jawab, dan kemampuan beradaptasi dengan cepat di lingkungan kerja baru.

Saya yakin pengalaman dan sikap kerja saya sesuai dengan kebutuhan posisi tersebut, dan saya ingin berkontribusi bagi {{company}}.

CV saya terlampir untuk ditinjau. Saya terbuka untuk wawancara atau tes lanjutan sesuai jadwal Bapak/Ibu.

Terima kasih atas waktu dan kesempatannya.

Hormat saya,
{{nama}}
{{telepon}} | {{email}}`
};

/* ---------- Elemen DOM ---------- */
const $ = (id) => document.getElementById(id);
const form = $("applyForm"), toEmail = $("toEmail"), company = $("company"),
      position = $("position"), template = $("template"), letter = $("letter"),
      sendBtn = $("sendBtn"), generateBtn = $("generateBtn"), msg = $("message"),
      historyBody = $("historyBody"), clearBtn = $("clearBtn");

const HISTORY_KEY = "riwayatLamaran";
const DAY = 86400000;
let letterEdited = false; // true jika isi surat sudah diedit manual

/* ---------- Generate cover letter ---------- */
function generateLetter() {
  const values = {
    company: company.value.trim() || "[Nama Perusahaan]",
    position: position.value.trim() || "[Posisi]",
    ...PELAMAR
  };
  letter.value = TEMPLATES[template.value].replace(/{{(\w+)}}/g, (_, k) => values[k] ?? "");
}

/* ---------- Riwayat (localStorage) ---------- */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
function saveHistory(item) {
  const list = loadHistory();
  list.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}
function td(text) {
  const el = document.createElement("td");
  el.textContent = text; // textContent mencegah injeksi HTML
  return el;
}
function renderHistory() {
  const list = loadHistory();
  historyBody.innerHTML = "";
  if (!list.length) {
    historyBody.innerHTML = '<tr><td colspan="4" class="empty">Belum ada lamaran terkirim.</td></tr>';
  }
  list.forEach((h) => {
    const tr = document.createElement("tr");
    tr.append(td(h.date), td(h.company), td(h.position));
    const st = document.createElement("td");
    st.innerHTML = '<span class="pill">Terkirim</span>';
    tr.appendChild(st);
    historyBody.appendChild(tr);
  });
  renderDashboard(list);
}

/* ---------- Dashboard: statistik, grafik, panel kanan ---------- */
function renderDashboard(list) {
  const now = Date.now();
  const startOfToday = new Date().setHours(0, 0, 0, 0);

  // Jumlah per hari untuk 7 hari terakhir (hanya entri yang punya timestamp "ts")
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const start = startOfToday - i * DAY;
    const count = list.filter((h) => h.ts >= start && h.ts < start + DAY).length;
    days.push({ start, count, label: new Date(start).toLocaleDateString("id-ID", { weekday: "short" }) });
  }
  const weekCount = days.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));

  $("bars").innerHTML = days.map((d, i) =>
    `<div class="bar-col${i === 6 ? " today" : ""}"><b>${d.count || ""}</b>` +
    `<div class="bar" style="height:${Math.max(6, (d.count / max) * 100)}%"></div>${d.label}</div>`
  ).join("");

  const percent = Math.min(100, Math.round((weekCount / TARGET_MINGGUAN) * 100));
  $("ring").style.setProperty("--p", percent);
  $("ringText").textContent = percent + "%";
  $("ringLabel").textContent = weekCount + " dari " + TARGET_MINGGUAN + " lamaran minggu ini";

  $("statTotal").textContent = list.length;
  $("statCompany").textContent = new Set(list.map((h) => h.company.toLowerCase())).size;
  $("heroText").textContent = weekCount
    ? "Kamu sudah mengirim " + weekCount + " lamaran dalam 7 hari terakhir. Target minggu ini " + TARGET_MINGGUAN + " lamaran."
    : "Belum ada lamaran dalam 7 hari terakhir. Isi form di bawah untuk mulai mengirim.";

  // Panel kanan: 4 lamaran terakhir
  const recent = $("recent");
  recent.innerHTML = "";
  if (!list.length) recent.innerHTML = '<li class="none">Belum ada lamaran terkirim.</li>';
  list.slice(0, 4).forEach((h) => {
    const li = document.createElement("li");
    const dot = document.createElement("span"); dot.className = "dot"; dot.textContent = (h.company[0] || "?").toUpperCase();
    const box = document.createElement("div");
    const b = document.createElement("b"); b.textContent = h.company;
    const s = document.createElement("small"); s.textContent = h.position;
    box.append(b, s); li.append(dot, box); recent.appendChild(li);
  });
}

function renderStatic() {
  const initials = PELAMAR.nama.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  $("avatar").textContent = initials;
  $("profName").textContent = PELAMAR.nama;
  $("profEmail").textContent = PELAMAR.email;
  $("profPhone").textContent = PELAMAR.telepon;
  $("heroName").textContent = PELAMAR.nama;
  const d = new Date();
  $("today").textContent = d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  $("weekChip").textContent = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/* ---------- Pesan status & loading ---------- */
function showMessage(text, type) {
  msg.textContent = text;
  msg.className = "message " + (type || "");
}
function setLoading(on) {
  sendBtn.disabled = on;
  generateBtn.disabled = on;
  sendBtn.classList.toggle("loading", on);
  sendBtn.querySelector(".btn-label").textContent = on ? "Mengirim..." : "Kirim lamaran sekarang";
}

/* ---------- Kirim lamaran lewat Google Apps Script ---------- */
async function sendApplication(e) {
  e.preventDefault();
  [toEmail, company, position].forEach((el) => el.classList.remove("invalid"));

  const missing = [toEmail, company, position].filter((el) => !el.value.trim() || !el.checkValidity());
  if (missing.length || !letter.value.trim()) {
    missing.forEach((el) => el.classList.add("invalid"));
    showMessage("Lengkapi email tujuan, perusahaan, posisi, dan isi cover letter.", "err");
    return;
  }
  if (/\[(Nama Perusahaan|Posisi)\]/.test(letter.value)) {
    showMessage("Cover letter masih berisi [Nama Perusahaan] atau [Posisi]. Klik Generate dulu.", "err");
    return;
  }
  if (SCRIPT_URL.startsWith("ISI_")) {
    showMessage("SCRIPT_URL di app.js belum diisi.", "err");
    return;
  }

  setLoading(true);
  showMessage("");
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      // text/plain menghindari error CORS (preflight) pada Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: SECRET,
        to_email: toEmail.value.trim(),
        from_name: PELAMAR.nama,
        reply_to: PELAMAR.email,
        subject: "Lamaran " + position.value.trim() + " - " + PELAMAR.nama,
        message: letter.value
      })
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || "Server menolak permintaan.");

    saveHistory({
      ts: Date.now(),
      date: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
      company: company.value.trim(),
      position: position.value.trim()
    });
    renderHistory();
    showMessage("Lamaran terkirim ke " + toEmail.value.trim() + ".", "ok");
  } catch (err) {
    console.error(err);
    showMessage("Gagal mengirim: " + (err.message || "periksa SCRIPT_URL dan SECRET."), "err");
  } finally {
    setLoading(false);
  }
}

/* ---------- Event ---------- */
generateBtn.addEventListener("click", () => { letterEdited = false; generateLetter(); });
template.addEventListener("change", () => { letterEdited = false; generateLetter(); });
company.addEventListener("input", () => { if (!letterEdited) generateLetter(); });
position.addEventListener("input", () => { if (!letterEdited) generateLetter(); });
letter.addEventListener("input", () => { letterEdited = true; });
form.addEventListener("submit", sendApplication);
$("newBtn").addEventListener("click", () => setTimeout(() => toEmail.focus(), 300));
clearBtn.addEventListener("click", () => {
  if (confirm("Hapus semua riwayat pengiriman?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

renderStatic();
generateLetter();
renderHistory();
