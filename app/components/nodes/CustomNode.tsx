"export default function CustomNode() {
  return <div>Node</div>;
}
      style={{
        padding: 10,
        borderRadius: 8,
        background: "#111",
        color: "#fff",
        border: "1px solid #333",
        minWidth: 120,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.6 }}>NODE</div>
      <div style={{ fontWeight: 600 }}>
        {data?.label || "Sin label"}
      </div>
    </div>
  );
}