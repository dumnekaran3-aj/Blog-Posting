import api from "../services/api";

// Shared by MediaUploader (post media) and AvatarUpload (profile picture).
// Asks our backend for a presigned URL, then PUTs the file straight to R2.
export default async function uploadDirectToR2(fileOrBlob, filename, contentType) {
  const { data } = await api.post("/upload/presign", { filename, contentType });

  const putResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileOrBlob,
  });

  if (!putResponse.ok) {
    throw new Error("Upload to storage failed");
  }

  return data.publicUrl;
}