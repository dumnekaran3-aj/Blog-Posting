import { AlertCircle, CheckCircle2 } from "lucide-react";

// Small reusable alert box for form feedback. Two variants:
//   - "error" (default) — red, for validation/API failures
//   - "success" — green, for confirmations
//
// Used instead of a bare `<p className="text-xs text-danger">` so
// important messages (like "this email domain doesn't exist") are
// actually noticeable, not a thin line of small text easy to miss.
export default function FormAlert({ message, variant = "error" }) {
  if (!message) return null;

  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
        isError
          ? "bg-danger/10 border-danger/30 text-danger"
          : "bg-success/10 border-success/30 text-success"
      }`}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}