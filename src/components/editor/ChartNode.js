import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ChartNodeView from "./ChartNodeView";

const ChartNode = Node.create({
  name: "chartEmbed",
  group: "block",
  atom: true, // no editable inner content — it's a single opaque unit

  addAttributes() {
    return {
      chartType: { default: "bar" },
      rows: { default: [] }, // [{ label, value }]
    };
  },

  parseHTML() {
    return [
      {
        tag: "chart-embed",
        getAttrs: (el) => {
          let rows = [];
          try {
            rows = JSON.parse(el.getAttribute("data-chart-rows") || "[]");
          } catch {
            rows = [];
          }
          return {
            chartType: el.getAttribute("data-chart-type") || "bar",
            rows,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "chart-embed",
      mergeAttributes(HTMLAttributes, {
        "data-chart-type": node.attrs.chartType,
        "data-chart-rows": JSON.stringify(node.attrs.rows),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },
});

export default ChartNode;