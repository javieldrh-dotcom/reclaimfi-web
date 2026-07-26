"use client";
import { useState, useEffect, useId } from "react";

interface Account { id: string; account_code: string; account_name: string; }

interface Props {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
}

export default function AccountSearchSelect({ accounts, value, onChange, placeholder, style }: Props) {
  const listId = "acc-list-" + useId();
  const selectedAccount = accounts.find((a) => a.id === value);
  const [textValue, setTextValue] = useState(selectedAccount ? selectedAccount.account_code + " - " + selectedAccount.account_name : "");

  useEffect(() => {
    const acc = accounts.find((a) => a.id === value);
    setTextValue(acc ? acc.account_code + " - " + acc.account_name : "");
  }, [value, accounts]);

  function handleInput(text: string) {
    setTextValue(text);
    const match = accounts.find((a) => (a.account_code + " - " + a.account_name) === text);
    if (match) {
      onChange(match.id);
    }
  }

  return (
    <div style={{ flex: 1, ...style }}>
      <input
        list={listId}
        value={textValue}
        onChange={(e) => handleInput(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8,
          border: "1px solid #1F2937", background: "#0d1117", color: "white", boxSizing: "border-box",
        }}
      />
      <datalist id={listId}>
        {accounts.map((a) => (
          <option key={a.id} value={a.account_code + " - " + a.account_name} />
        ))}
      </datalist>
    </div>
  );
}