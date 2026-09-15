export type Language = "zh" | "en";

export type LocalizedText = {
  zh: string;
  en: string;
};

export type TranslationParams = Record<string, string | number>;
