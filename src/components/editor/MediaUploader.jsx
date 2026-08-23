import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import uploadDirectToR2 from "../../utils/uploadDirect";

// Captures a frame from a LOCAL video file using an offscreen <video> +
// <canvas>. Includes a timeout safeguard — some video files report an
// unreliable `duration` right after loading (Infinity/NaN until a first
// seek), which can otherwise leave the "seeked" event never firing and the
// promise hanging forever.
const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail generation timed out"));
    }, 8000);

    video.onloadeddata = () => {
      const seekTime =
        isFinite(video.duration) && video.duration > 0 ? Math.min(1, video.duration / 2) : 0.1;
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (blob) resolve(blob);
          else reject(new Error("Could not generate thumbnail"));
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error("Could not read video file"));
    };
  });
};

// Reusable across Create Post and Edit Post. Uploads DIRECTLY to R2 via a
// presigned URL — our backend only issues the URL, the file itself never
// passes through Node, which is much faster for video/audio.
export default function MediaUploader({ mediaType, mediaUrl, onUploaded, onThumbnailGenerated }) {
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

    try {
      const url = await uploadDirectToR2(file, file.name, file.type);
      onUploaded(url);

      if (mediaType === "video" && onThumbnailGenerated) {
        try {
          const thumbBlob = await generateVideoThumbnail(file);
          const thumbUrl = await uploadDirectToR2(thumbBlob, "thumbnail.jpg", "image/jpeg");
          onThumbnailGenerated(thumbUrl);
        } catch (thumbErr) {
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