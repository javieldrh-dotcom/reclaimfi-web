import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "pt", "zh", "hi", "ru", "fr", "ar", "sw", "ja", "ko", "zh-TW", "fa", "de", "it", "id", "ha"],
  defaultLocale: "es",
});

export type Locale = (typeof routing.locales)[number];