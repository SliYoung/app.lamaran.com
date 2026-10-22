// Tempel seluruh kode ini di script.google.com (file Code.gs)

// Kata rahasia: HARUS SAMA dengan SECRET di app.js
const SECRET = "ganti-dengan-kata-rahasia";

// Opsional: ID file CV di Google Drive. Kosongkan ("") jika tanpa lampiran.
// ID ada di URL file: drive.google.com/file/d/INI_ID_NYA/view
const CV_FILE_ID = "";

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) throw new Error("Akses ditolak: SECRET tidak cocok");

    const options = { name: d.from_name, replyTo: d.reply_to };
    if (CV_FILE_ID) {
      options.attachments = [DriveApp.getFileById(CV_FILE_ID).getBlob()];
    }

    GmailApp.sendEmail(d.to_email, d.subject, d.message, options);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
