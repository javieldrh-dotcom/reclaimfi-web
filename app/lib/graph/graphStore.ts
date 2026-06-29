import { create } from "zustand";

type Node = any;
type Edge = any;

type GraphState = {
  nodes: Node[];
  edges: Edge[];

  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  updateNode: (node: Node) => void;

  reset: () => void;
};

export const graphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes.filter(n => n.id !== node.id), node],
    }));
  },

  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges.filter(e => e.id !== edge.id), edge],
    }));
  },

  updateNode: (node) => {
    set((state) => ({
      nodes: state.nodes.map(n =>
        n.id === node.id ? node : n
      ),
    }));
  },

  reset: () => set({ nodes: [], edges: [] }),
}));