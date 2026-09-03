import { useState } from "react";
import { X, Copy, Check, MoreHorizontal } from "lucide-react";
import { FaWhatsapp, FaTelegramPlane, FaFacebookF, FaInstagram, FaBluetoothB } from "react-icons/fa";

// A few of these platforms don't actually have a "share this exact link"
// web API, so they're handled honestly rather than faked:
//  - WhatsApp / Telegram / Facebook have real web share URLs — used directly.
//  - Instagram has no web link-sharing API at all — we copy the link and
//    tell the user to paste it (the same workaround every other web app
//    uses for Instagram).
//  - Bluetooth has no web API of any kind — tapping it opens the phone's
//    native OS share sheet (navigator.share), which already lists
//    Bluetooth as one of its built-in targets on Android.
export default function ShareMenu({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title || "Check this out on VarityWire");

  const flashCopied = (message) => {
    setCopied(true);
    setNote(message);
    setTimeout(() => {
      setCopied(false);
      setNote("");
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      flashCopied("Link copied");
    } catch {
      // clipboard API can fail on non-HTTPS/older browsers — nothing to do
    }
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      flashCopied("Link copied — paste it in your Instagram Story or DM");
    } catch {
      // ignore
    }
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        onClose();
      } catch {
        // user cancelled the OS share sheet — not an error
      }
    } else {
      handleCopy();
    }
  };

  const platforms = [
    {
      name: "WhatsApp",
      Icon: FaWhatsapp,
      bg: "bg-[#25D366]",
      onClick: () => window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, "_blank", "noopener,noreferrer"),
    },
    {
      name: "Telegram",
      Icon: FaTelegramPlane,
      bg: "bg-[#26A5E4]",
      onClick: () => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, "_blank", "noopener,noreferrer"),
    },
    {
      name: "Facebook",
      Icon: FaFacebookF,
      bg: "bg-[#1877F2]",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "noopener,noreferrer"),
    },
    {
      name: "Instagram",
      Icon: FaInstagram,
      bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      onClick: handleInstagram,
    },
    {
      name: "Bluetooth",
      Icon: FaBluetoothB,
      bg: "bg-[#0082FC]",
      onClick: handleMore,
    },
    {
      name: "More",
      Icon: MoreHorizontal,
      bg: "bg-textMuted",
      onClick: handleMore,
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share post"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:w-96 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-textDark">Share post</h3>
          <button onClick={onClose} aria-label="Close" className="text-textMuted hover:text-textDark">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
          {platforms.map(({ name, Icon, bg, onClick }) => (
            <button
              key={name}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 text-textDark"
            >
              <span className={`w-11 h-11 rounded-full ${bg} text-white flex items-center justify-center`}>
                <Icon size={18} />
              </span>
              <span className="text-[11px] text-textMuted">{name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="mt-5 w-full flex items-center justify-center gap-2 text-sm border border-borderClr rounded-lg py-2.5 text-textDark hover:bg-bgLight transition-colors"
        >
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
          {copied ? note : "Copy link"}
        </button>
      </div>
    </div>
  );
}