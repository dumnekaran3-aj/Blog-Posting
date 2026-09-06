import api from "../services/api";

// Shared by MediaUploader (post media) and AvatarUpload (profile picture).
// Asks our backend for a presigned URL, then PUTs the file straight to R2.
// `folder` decides where in the R2 bucket it's organized — 'posts' or
// 'avatars' (backend validates this against an allowlist either way).
export default async function uploadDirectToR2(fileOrBlob, filename, contentType, folder = "posts") {
  const { data } = await api.post("/upload/presign", { filename, contentType, folder });

  const putResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileOrBlob,
  });

  if (!putResponse.ok) {
    // Pehle ye sirf generic "Upload to storage failed" tha — ab actual
    // status bhi include karte hain taaki agla debugging round fast ho
    // (403 = signature/CORS issue, 413 = file too large, etc.)
    throw new Error(`Upload to storage failed (status ${putResponse.status})`);
  }

  return data.publicUrl;
}