export interface CanvasNode {
  id: string;
  type: string;
  text?: string;
  file?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  [key: string]: unknown;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: string;
  toNode: string;
  toSide?: string;
  label?: string;
  color?: string;
  [key: string]: unknown;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  [key: string]: unknown;
}

export type CanvasDiffOperation =
  | { type: "updateNode"; id: string; patch: Partial<CanvasNode> }
  | { type: "deleteNode"; id: string }
  | { type: "createNode"; node: CanvasNode }
  | { type: "updateEdge"; id: string; patch: Partial<CanvasEdge> }
  | { type: "deleteEdge"; id: string }
  | { type: "createEdge"; edge: CanvasEdge }
  | { type: "replaceData"; data: CanvasData };

export interface CanvasDiffPayload {
  operations: CanvasDiffOperation[];
  summary?: string;
  message?: string;
}

export interface CanvasDiffResult {
  data: CanvasData;
  applied: CanvasDiffOperation[];
}

const clone = <T>(value: T): T => structuredClone(value);

export function applyCanvasDiff(original: CanvasData, diff: CanvasDiffPayload): CanvasDiffResult {
  let data = clone(original);
  const applied: CanvasDiffOperation[] = [];

  for (const op of diff.operations ?? []) {
    switch (op.type) {
      case "replaceData": {
        data = clone(op.data);
        applied.push(op);
        break;
      }
      case "createNode": {
        if (!data.nodes.find((node) => node.id === op.node.id)) {
          data.nodes = [...data.nodes, clone(op.node)];
          applied.push(op);
        }
        break;
      }
      case "updateNode": {
        const index = data.nodes.findIndex((node) => node.id === op.id);
        if (index !== -1) {
          const node = { ...data.nodes[index], ...clone(op.patch) };
          data.nodes = [...data.nodes.slice(0, index), node, ...data.nodes.slice(index + 1)];
          applied.push(op);
        }
        break;
      }
      case "deleteNode": {
        if (data.nodes.some((node) => node.id === op.id)) {
          data.nodes = data.nodes.filter((node) => node.id !== op.id);
          data.edges = data.edges.filter((edge) => edge.fromNode !== op.id && edge.toNode !== op.id);
          applied.push(op);
        }
        break;
      }
      case "createEdge": {
        if (!data.edges.find((edge) => edge.id === op.edge.id)) {
          data.edges = [...data.edges, clone(op.edge)];
          applied.push(op);
        }
        break;
      }
      case "updateEdge": {
        const index = data.edges.findIndex((edge) => edge.id === op.id);
        if (index !== -1) {
          const edge = { ...data.edges[index], ...clone(op.patch) };
          data.edges = [...data.edges.slice(0, index), edge, ...data.edges.slice(index + 1)];
          applied.push(op);
        }
        break;
      }
      case "deleteEdge": {
        if (data.edges.some((edge) => edge.id === op.id)) {
          data.edges = data.edges.filter((edge) => edge.id !== op.id);
          applied.push(op);
        }
        break;
      }
    }
  }

  return { data, applied };
}

export function renderCanvasDiffSummary(diff: CanvasDiffPayload): string {
  const counts: Record<string, number> = {};
  for (const op of diff.operations ?? []) {
    counts[op.type] = (counts[op.type] ?? 0) + 1;
  }

  const details = Object.entries(counts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  if (!details) {
    return "No changes suggested.";
  }

  return diff.summary ? `${diff.summary}\n${details}` : details;
}
