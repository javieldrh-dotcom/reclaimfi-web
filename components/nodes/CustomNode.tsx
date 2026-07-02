"use client";

export default function CustomNode({ data }: any) {
  return (
    <div style={{ padding: 10, background: "#111", color: "#fff" }}>
      {data?.label || "Node"}
    </div>
  );
}