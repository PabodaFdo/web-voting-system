// src/utils/photo.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

/**
 * Accepts a nominee object and returns a usable <img src>.
 * Supports absolute URLs, data URLs, /uploads paths, plain filenames, or an id via /api/nominees/{id}/photo.
 */
export function resolvePhotoSrc(n) {
  if (!n) return "";

  // common backend field names for the image
  const raw = n.photo || n.photoUrl || n.image || n.imageUrl || n.fileName || "";

  if (!raw) {
    // If backend provides an id, serve via controller endpoint
    if (n.photoId) return `${API_BASE}/api/nominees/${n.photoId}/photo`;
    if (n.id) return `${API_BASE}/api/nominees/${n.id}/photo`;
    return "";
  }

  // Already a full URL or base64
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }

  // Backend gave an absolute path like "/uploads/abc.jpg"
  if (raw.startsWith("/")) {
    return `${API_BASE}${raw}`;
  }

  // Otherwise assume it's a bare filename stored under /uploads
  return `${API_BASE}/uploads/${raw}`;
}
