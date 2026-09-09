import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const CHART_TYPES = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
];

export default function ChartBuilder({ onInsert, onClose }) {
  const [type, setType] = useState("bar");
  const [rows, setRows] = useState([
    { label: "", value: "" },
    { label: "", value: "" },
    { label: "", value: "" },
  ]);

  const updateRow = (i, field, val) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };

  const addRow = () => {
    if (rows.length >= 20) return; // matches PostChart's MAX_ROWS
    setRows((prev) => [...prev, { label: "", value: "" }]);
  };

  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const hasValidRow = rows.some((r) => r.label.trim() && r.value.toString().trim() !== "");

  return (
    <div className="w-72 bg-white border border-borderClr rounded-md p-3 shadow-md">
      <div className="flex gap-1 mb-2">
        {CHART_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
              type === t.value
                ? "bg-primary text-white border-primary"
                : "text-textMuted border-borderClr hover:border-primary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              placeholder="Label"
              value={row.label}
              onChange={(e) => updateRow(i, "label", e.target.value)}
              className="flex-1 text-xs border border-borderClr rounded px-2 py-1 outline-none focus:border-primary min-w-0"
            />
            <input
              type="number"
              placeholder="Value"
              value={row.value}
              onChange={(e) => updateRow(i, "value", e.target.value)}
              className="w-16 text-xs border border-borderClr rounded px-2 py-1 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              className="text-textMuted hover:text-danger disabled:opacity-30"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= 20}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-40"
        >
          <Plus size={12} /> Add row
        </button>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] px-2.5 py-1 rounded-md border border-borderClr text-textMuted hover:bg-bgLight"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasValidRow}
            onClick={() => onInsert(type, rows)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-white disabled:opacity-40"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}