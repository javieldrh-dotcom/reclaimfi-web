"use client";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Espanol",
  en: "English",
  pt: "Portugues",
  zh: "中文",
  hi: "हिन्दी",
  ru: "Русский",
  fr: "Francais",
  ar: "العربية",
  sw: "Kiswahili",
  ja: "日本語",
  ko: "한국어",
  "zh-TW": "繁體中文",
  fa: "فارسی",
  de: "Deutsch",
  it: "Italiano",
  id: "Bahasa Indonesia",
  ha: "Hausa",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function handleChange(newLocale: string) {
    const segments = pathname.split("/").filter(Boolean);
    const isLocalePrefixed = (routing.locales as readonly string[]).includes(segments[0]);
    const rest = isLocalePrefixed ? segments.slice(1) : segments;
    const newPath = "/" + [newLocale, ...rest].join("/");
    router.push(newPath);
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        background: "transparent",
        border: "1px solid #3A4A63",
        color: "#C9D3E0",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc} style={{ background: "#16233A", color: "#C9D3E0" }}>
          {LANGUAGE_LABELS[loc] ?? loc}
        </option>
      ))}
    </select>
  );
}