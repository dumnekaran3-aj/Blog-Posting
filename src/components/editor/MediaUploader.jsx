import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import api from "../../services/api";

// Reusable across Create Post and (later) Edit Post. Parent controls mediaType;
// this component only handles picking a file, uploading it, and reporting back the URL.
export default function MediaUploader({ mediaType, mediaUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const acceptMap = {
    image: "image/jpeg,image/png,image/webp,image/gif",
    video: "video/mp4,video/webm",
    audio: "audio/mpeg,audio/mp3,audio/wav",
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data.url);
    } catch (err) {
      setError(err.response?.data?.msg || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = ""; // allows re-selecting the same file
    }
  };

  if (mediaType === "text") return null; // nothing to upload for text-only posts

  return (
    <div>
      {!mediaUrl ? (
        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-borderClr rounded-lg py-8 cursor-pointer hover:border-primary/40 transition-colors">
          {uploading ? (
            <Loader2 size={22} className="text-primary animate-spin" />
          ) : (
            <Upload size={22} className="text-textMuted" />
          )}
          <span className="text-xs text-textMuted">
            {uploading ? "Uploading..." : `Click to upload ${mediaType}`}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={acceptMap[mediaType]}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      ) : (
        <div className="relative border border-borderClr rounded-lg p-3">
          {mediaType === "image" && (
            <img src={mediaUrl} alt="Uploaded" className="w-full max-h-64 object-cover rounded-md" />
          )}
          {mediaType === "video" && (
            <video src={mediaUrl} controls className="w-full max-h-64 rounded-md" />
          )}
          {mediaType === "audio" && <audio src={mediaUrl} controls className="w-full" />}

          <button
            type="button"
            onClick={() => onUploaded("")}
            className="absolute top-2 right-2 bg-white border border-borderClr rounded-full p-1 hover:bg-slate-50"
            aria-label="Remove media"
          >
            <X size={14} className="text-textMuted" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  );
}