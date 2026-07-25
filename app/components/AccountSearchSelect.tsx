"use client";
import { useState, useRef, useEffect } from "react";

interface Account { id: string; account_code: string; account_name: string; }

interface Props {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
}

export default function AccountSearchSelect({ accounts, value, onChange, placeholder, style }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find((a) => a.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = accounts.filter((a) =>
    (a.account_code + " " + a.account_name).toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50);

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1, ...style }}>
      <input
        value={isOpen ? query : (selectedAccount ? selectedAccount.account_code + " - " + selectedAccount.account_name : "")}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => { setQuery(""); setIsOpen(true); }}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8,
          border: "1px solid #1F2937", background: "#0d1117", color: "white",
        }}
      />
      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#0d1117", border: "1px solid #1F2937", borderRadius: 8,
          maxHeight: 260, overflowY: "auto", marginTop: 4,
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 10, fontSize: 13, color: "#8B93A7" }}>Sin resultados.</div>
          )}
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => { onChange(a.id); setQuery(""); setIsOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 14, cursor: "pointer", borderBottom: "1px solid #1a1f2b" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1f2b")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {a.account_code} - {a.account_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}