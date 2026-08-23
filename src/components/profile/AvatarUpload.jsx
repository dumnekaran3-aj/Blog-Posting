import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import uploadDirectToR2 from "../../utils/uploadDirect";

// A circular avatar that, on click, opens a file picker and uploads
// directly to R2. Fires onUploaded(url) when done.
export default function AvatarUpload({ avatarUrl, name, size = 56, onUploaded, onClickImage }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadDirectToR2(file, file.name, file.type);
      onUploaded(url);
    } catch (err) {
      // could add a toast here later
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          onClick={onClickImage}
          className="w-full h-full rounded-full object-cover cursor-pointer"
        />
      ) : (
        <div
          onClick={onClickImage}
          className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium cursor-pointer"
          style={{ fontSize: size / 2.8 }}
        >
          {name?.charAt(0).toUpperCase() || "U"}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 border-2 border-white hover:bg-primary/90"
        aria-label="Change profile picture"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}