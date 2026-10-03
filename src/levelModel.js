export const PROJECTION = Object.freeze({
  xStep: 40,
  groundStep: 24,
  heightStep: 24
});

const freezeNode = (node) => Object.freeze({ ...node });
const freezeEdge = (edge) => Object.freeze({ ...edge });

export const FALSE_JUNCTION_LEVEL = Object.freeze({
  id: "false-junction",
  title: "The False Junction",
  start: "start",
  goal: "goal",
  revealPolicy: "always",
  nodes: Object.freeze({
    start: freezeNode({ x: -3, y: 0, z: 0, path: "lower" }),
    low1: freezeNode({ x: -2, y: 0, z: 0, path: "lower" }),
    low2: freezeNode({ x: -1, y: 0, z: 0, path: "lower" }),
    lowJ: freezeNode({ x: 0, y: 0, z: 0, path: "lower" }),
    highJ: freezeNode({ x: 1, y: 1, z: 2, path: "upper" }),
    high1: freezeNode({ x: 2, y: 1, z: 2, path: "upper" }),
    high2: freezeNode({ x: 3, y: 1, z: 2, path: "upper" }),
    goal: freezeNode({ x: 4, y: 1, z: 2, path: "upper" })
  }),
  edges: Object.freeze([
    freezeEdge({ from: "start", to: "low1", kind: "ordinary" }),
    freezeEdge({ from: "low1", to: "low2", kind: "ordinary" }),
    freezeEdge({ from: "low2", to: "lowJ", kind: "ordinary" }),
    freezeEdge({ from: "lowJ", to: "highJ", kind: "apparent" }),
    freezeEdge({ from: "highJ", to: "high1", kind: "ordinary" }),
    freezeEdge({ from: "high1", to: "high2", kind: "ordinary" }),
    freezeEdge({ from: "high2", to: "goal", kind: "ordinary" })
  ])
});

function edgeKey(a, b) {
  return [a, b].sort().join("::");
}

function assertCoordinate(nodeId, node, coordinate) {
  if (!Number.isFinite(node[coordinate])) {
    throw new Error(`Node "${nodeId}" needs a finite ${coordinate} coordinate`);
  }
}

export class LevelModel {
  constructor(definition = FALSE_JUNCTION_LEVEL) {
    this.definition = definition;
    this.nodes = definition.nodes;
    this.start = definition.start;
    this.goal = definition.goal;
    this.revealPolicy = definition.revealPolicy;
    this.adjacency = new Map();
    this.edgeKinds = new Map();

    this.validateDefinition();

    for (const nodeId of Object.keys(this.nodes)) {
      this.adjacency.set(nodeId, []);
    }

    for (const edge of definition.edges) {
      this.adjacency.get(edge.from).push(edge.to);
      this.adjacency.get(edge.to).push(edge.from);
      this.edgeKinds.set(edgeKey(edge.from, edge.to), edge.kind);
    }
  }

  validateDefinition() {
    if (!this.nodes || Object.keys(this.nodes).length === 0) {
      throw new Error("A level needs at least one node");
    }

    if (!Object.hasOwn(this.nodes, this.start)) {
      throw new Error(`Unknown start node "${this.start}"`);
    }

    if (!Object.hasOwn(this.nodes, this.goal)) {
      throw new Error(`Unknown goal node "${this.goal}"`);
    }

    if (!["always", "afterSolve"].includes(this.revealPolicy)) {
      throw new Error(`Unsupported reveal policy "${this.revealPolicy}"`);
    }

    for (const [nodeId, node] of Object.entries(this.nodes)) {
      assertCoordinate(nodeId, node, "x");
      assertCoordinate(nodeId, node, "y");
      assertCoordinate(nodeId, node, "z");
    }

    const seenEdges = new Set();
    for (const edge of this.definition.edges) {
      if (!Object.hasOwn(this.nodes, edge.from) || !Object.hasOwn(this.nodes, edge.to)) {
        throw new Error(`Edge references an unknown node: ${edge.from} -> ${edge.to}`);
      }
      if (edge.from === edge.to) {
        throw new Error(`Self-edge is not allowed at "${edge.from}"`);
      }
      if (!["ordinary", "apparent"].includes(edge.kind)) {
        throw new Error(`Unsupported edge kind "${edge.kind}"`);
      }

      const key = edgeKey(edge.from, edge.to);
      if (seenEdges.has(key)) {
        throw new Error(`Duplicate edge "${key}"`);
      }
      seenEdges.add(key);

      if (edge.kind === "apparent") {
        const from = this.project(edge.from);
        const to = this.project(edge.to);
        if (from.x !== to.x || from.y !== to.y) {
          throw new Error(`Apparent edge endpoints must share a projection: ${key}`);
        }
      }
    }
  }

  node(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) throw new Error(`Unknown node "${nodeId}"`);
    return node;
  }

  neighbors(nodeId) {
    this.node(nodeId);
    return [...this.adjacency.get(nodeId)];
  }

  canMove(from, to) {
    this.node(from);
    this.node(to);
    return this.adjacency.get(from).includes(to);
  }

  move(from, to) {
    if (!this.canMove(from, to)) {
      throw new Error(`Illegal move: ${from} -> ${to}`);
    }
    return to;
  }

  project(nodeOrId, origin = { x: 0, y: 0 }) {
    const node = typeof nodeOrId === "string" ? this.node(nodeOrId) : nodeOrId;
    if (!node) throw new Error("Cannot project a missing node");

    return {
      x: origin.x + (node.x - node.y) * PROJECTION.xStep,
      y: origin.y
        + (node.x + node.y) * PROJECTION.groundStep
        - node.z * PROJECTION.heightStep
    };
  }

  isApparentEdge(from, to) {
    return this.edgeKinds.get(edgeKey(from, to)) === "apparent";
  }

  isGoal(nodeId) {
    this.node(nodeId);
    return nodeId === this.goal;
  }
}

