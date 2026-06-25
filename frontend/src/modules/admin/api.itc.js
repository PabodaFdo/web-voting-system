// api.itc.js
import { api } from "./api";

function authHeaders() {
  try {
    const t = JSON.parse(localStorage.getItem("admin_auth") || "null")?.token;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
}

export async function listBackups() {
  const { data } = await api.get("/api/itc/backups", { headers: authHeaders() });
  return data;
}

export async function triggerBackup() {
  const { data } = await api.post("/api/itc/backups", null, { headers: authHeaders() });
  return data;
}

/* ======== DOWNLOAD HELPERS (BLOB) ======== */
function parseFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  if (!m) return null;
  try { return decodeURIComponent(m[1].replace(/\"/g, "")); } catch { return m[1]; }
}

async function forceDownload(url, suggestedName) {
  const res = await api.get(url, {
    headers: authHeaders(),
    responseType: "blob",
    validateStatus: s => s < 500 // allow 404 bodies to be read
  });
  if (res.status !== 200) {
    const text = await res.data.text?.() ?? "Download failed";
    throw new Error(text);
  }
  const blob = res.data;
  const cd = res.headers?.["content-disposition"];
  const name = parseFilenameFromDisposition(cd) || suggestedName || "download.bin";

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 0);
}

export async function downloadBackupSql(id, name = `backup_${id}.sql`) {
  await forceDownload(`/api/itc/backups/${id}/download-sql`, name);
}
export async function downloadBackupH2(id, name = `backup_${id}_h2.zip`) {
  await forceDownload(`/api/itc/backups/${id}/download-h2`, name);
}

/* ======== RESTORE / DELETE ======== */
export async function restoreByIdSql(id) {
  const { data } = await api.post(`/api/itc/backups/${id}/restore-sql`, null, { headers: authHeaders() });
  return data;
}

export async function restoreFromFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post(`/api/itc/restore`, fd, { headers: authHeaders() });
  return data;
}

export async function deleteBackup(id) {
  const { data } = await api.delete(`/api/itc/backups/${id}`, { headers: authHeaders() });
  return data;
}
