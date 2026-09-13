import { NodeViewWrapper } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import PostChart from "../blog/PostChart";

export default function ChartNodeView({ node, deleteNode }) {
  const { chartType, rows } = node.attrs;

  return (
    <NodeViewWrapper className="relative group my-2">
      <PostChart type={chartType} rows={rows} />
      <button
        type="button"
        onClick={deleteNode}
        title="Remove chart"
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-borderClr text-textMuted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </NodeViewWrapper>
  );
}