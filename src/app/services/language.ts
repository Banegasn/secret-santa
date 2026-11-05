export const VALID_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'nl', 'pl'] as const;
export type Language = typeof VALID_LANGUAGES[number];

export function normalizeLanguage(value: unknown): Language {
  return typeof value === 'string' && VALID_LANGUAGES.includes(value as Language)
    ? value as Language
    : 'en';
}
