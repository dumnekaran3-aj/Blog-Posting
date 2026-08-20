import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import api from "../../services/api";

// Captures a frame from a LOCAL video file (before upload) using an
// offscreen <video> + <canvas>. Using a local blob URL (not the remote R2
// URL) avoids canvas "tainted by cross-origin data" errors.
const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Grab a frame a little into the clip rather than frame 0, which is
      // often a black/blank frame
      video.currentTime = Math.min(1, video.duration / 2 || 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) resolve(blob);
          else reject(new Error("Could not generate thumbnail"));
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => reject(new Error("Could not read video file"));
  });
};

// Reusable across Create Post and Edit Post. Parent controls mediaType;
// this component handles picking a file, uploading it, and (for video)
// auto-generating + uploading a thumbnail snapshot.
export default function MediaUploader({ mediaType, mediaUrl, onUploaded, onThumbnailGenerated }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const acceptMap = {
    image: "image/jpeg,image/png,image/webp,image/gif",
    video: "video/mp4,video/webm",
    audio: "audio/mpeg,audio/mp3,audio/wav",
  };

  const uploadToServer = async (fileOrBlob, filename) => {
    const formData = new FormData();
    formData.append("file", fileOrBlob, filename);
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const url = await uploadToServer(file, file.name);
      onUploaded(url);

      // Video only — generate a real snapshot frame and upload it as the
      // post's thumbnail, so the card shows an actual preview instead of a
      // generic icon
      if (mediaType === "video" && onThumbnailGenerated) {
        try {
          const thumbBlob = await generateVideoThumbnail(file);
          const thumbUrl = await uploadToServer(thumbBlob, "thumbnail.jpg");
          onThumbnailGenerated(thumbUrl);
        } catch (thumbErr) {
          // Thumbnail generation failing shouldn't block the whole upload —
          // the post still works, just without a snapshot preview
          console.warn("Thumbnail generation failed:", thumbErr.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (mediaType === "text") return null;

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
          {mediaType === "video" && <video src={mediaUrl} controls className="w-full max-h-64 rounded-md" />}
          {mediaType === "audio" && <audio src={mediaUrl} controls className="w-full" />}

          <button
            type="button"
            onClick={() => {
              onUploaded("");
              if (onThumbnailGenerated) onThumbnailGenerated("");
            }}
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