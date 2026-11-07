/**
 * CHEMBOND — penerima jawaban siswa ke Google Spreadsheet
 * Tempel seluruh kode ini di: Spreadsheet → Ekstensi → Apps Script
 * Lalu Deploy → Deployment baru → Aplikasi web
 *   - Jalankan sebagai: Saya
 *   - Yang memiliki akses: Siapa saja
 */
const SHEET_NAME = 'Jawaban Siswa';

const HEADERS = (() => {
  const h = ['Waktu', 'Nama', 'Kelas', 'Nilai', 'Jumlah Benar',
    'Pertanyaan Pemantik', 'Pemahaman NH3', 'Pemahaman NH4+', 'Penjelasan H3O+'];
  for (let i = 1; i <= 10; i++) h.push('Soal ' + i, 'Status ' + i);
  h.push('Refleksi 1', 'Refleksi 2', 'Refleksi 3', 'Perangkat');
  return h;
})();

// Cegah teks siswa terbaca sebagai rumus (=, +, -, @)
function clean(v) {
  v = (v === undefined || v === null) ? '' : v;
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#1b3f9e').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const soal = (d.soal || []).slice(0, 10);
    while (soal.length < 10) soal.push({ jawaban: '', status: '' });
    const row = [new Date(), d.nama, d.kelas, d.nilai, d.benar,
      d.pemantik, d.nh3, d.nh4, d.h3o];
    soal.forEach(s => row.push(s.jawaban, s.status));
    row.push(d.refleksi1, d.refleksi2, d.refleksi3, d.perangkat);
    getSheet().appendRow(row.map(clean));
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Buka URL Web App di browser untuk mengecek: harus muncul "CHEMBOND aktif"
function doGet() {
  getSheet();
  return ContentService.createTextOutput('CHEMBOND aktif — siap menerima jawaban siswa.');
}
