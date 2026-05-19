// apps/api/src/services/deepl.ts — Schritt 7
import * as deepl from 'deepl-node';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

const LANG_MAP: Record<string, string> = {
  en: 'EN-US', de: 'DE', fr: 'FR',
  es: 'ES', it: 'IT', pt: 'PT-PT',
  nl: 'NL', pl: 'PL', ru: 'RU',
  ja: 'JA', ko: 'KO', tr: 'TR',
  uk: 'UK', sv: 'SV', da: 'DA',
  no: 'NB', cs: 'CS', hu: 'HU',
  ro: 'RO',
};

export async function translate(
  text:       string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text.trim()) return '';
  const result = await translator.translateText(
    text,
    LANG_MAP[sourceLang] as deepl.SourceLanguageCode,
    LANG_MAP[targetLang] as deepl.TargetLanguageCode,
  );
  return result.text;
}
