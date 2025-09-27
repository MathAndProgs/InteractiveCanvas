import { describe, expect, it } from "vitest";
import { applyCanvasDiff, type CanvasData, type CanvasDiffPayload } from "@/ai/CanvasDiff";

describe("applyCanvasDiff", () => {
  const base: CanvasData = {
    nodes: [
      { id: "a", type: "text", text: "Hello", x: 0, y: 0, width: 300, height: 200 },
      { id: "b", type: "text", text: "World", x: 400, y: 0, width: 300, height: 200 },
    ],
    edges: [
      { id: "edge-1", fromNode: "a", toNode: "b" },
    ],
  };

  it("applies node updates and deletions", () => {
    const diff: CanvasDiffPayload = {
      operations: [
        { type: "updateNode", id: "a", patch: { text: "Hello AI" } },
        { type: "deleteNode", id: "b" },
      ],
    };

    const { data, applied } = applyCanvasDiff(base, diff);
    expect(data.nodes.find((node) => node.id === "a")?.text).toBe("Hello AI");
    expect(data.nodes.find((node) => node.id === "b")).toBeUndefined();
    expect(data.edges).toHaveLength(0);
    expect(applied).toHaveLength(2);
  });

  it("creates new nodes and edges", () => {
    const diff: CanvasDiffPayload = {
      operations: [
        {
          type: "createNode",
          node: { id: "c", type: "text", text: "New", x: 200, y: 200, width: 300, height: 200 },
        },
        {
          type: "createEdge",
          edge: { id: "edge-2", fromNode: "a", toNode: "c" },
        },
      ],
    };

    const { data } = applyCanvasDiff(base, diff);
    expect(data.nodes.some((node) => node.id === "c")).toBe(true);
    expect(data.edges.some((edge) => edge.id === "edge-2")).toBe(true);
  });
});
