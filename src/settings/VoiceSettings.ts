export interface VoiceSettings {
  VOICE: string;
  SPEED: number;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  spellOutAcronyms: boolean;
  TTS_PROVIDER: "aws" | "google";
  GOOGLE_API_KEY: string;
}

export interface VoiceOption {
  id: string;
  label: string;
  lang: string;
}

export const VOICES: VoiceOption[] = [
  { id: "Stephen", label: "Stephen (American)", lang: "en-US" },
  { id: "Joanna", label: "Joanna (American)", lang: "en-US" },
  { id: "Brian", label: "Brian (British)", lang: "en-GB" },
  { id: "Emma", label: "Emma (British)", lang: "en-GB" },
  { id: "Daniel", label: "Daniel (German)", lang: "de-DE" },
  { id: "Vicki", label: "Vicki (German)", lang: "de-DE" },
  { id: "Remi", label: "Rémi (French)", lang: "fr-FR" },
  { id: "Lea", label: "Léa (French)", lang: "fr-FR" },
  { id: "Sergio", label: "Sergio (Spanish)", lang: "es-ES" },
  { id: "Lucia", label: "Lucia (Spanish)", lang: "es-ES" },
  { id: "Adriano", label: "Adriano (Italian)", lang: "it-IT" },
  { id: "Bianca", label: "Bianca (Italian)", lang: "it-IT" },
  { id: "Ola", label: "Ola (Polish)", lang: "pl-PL" },
  { id: "Laura", label: "Laura (Dutch)", lang: "nl-NL" },
  { id: "Ines", label: "Ines (Portuguese)", lang: "pt-PT" },
  { id: "Arlet", label: "Arlet (Catalan)", lang: "ca-ES" },
  { id: "Elin", label: "Elin (Swedish)", lang: "sv-SE" },
  { id: "Sofie", label: "Sofie (Danish)", lang: "da-DK" },
  { id: "Ida", label: "Ida (Norwegian)", lang: "nb-NO" },
  { id: "Suvi", label: "Suvi (Finnish)", lang: "fi-FI" },
  { id: "Takumi", label: "Takumi (Japanese)", lang: "ja-JP" },
  { id: "Tomoko", label: "Tomoko (Japanese)", lang: "ja-JP" },
  { id: "Seoyeon", label: "Seoyeon (Korean)", lang: "ko-KR" },
  { id: "Kajal", label: "Kajal (Hindi)", lang: "hi-IN" },
  { id: "Zhiyu", label: "Zhiyu (Mandarin)", lang: "cmn-CN" },
];

export const VOICES_GOOGLE: VoiceOption[] = [
  // English (US) - Neural2
  { id: "en-US-Neural2-A", label: "Neural2 A (US Male)", lang: "en-US" },
  { id: "en-US-Neural2-C", label: "Neural2 C (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-D", label: "Neural2 D (US Male)", lang: "en-US" },
  { id: "en-US-Neural2-E", label: "Neural2 E (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-F", label: "Neural2 F (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-G", label: "Neural2 G (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-H", label: "Neural2 H (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-I", label: "Neural2 I (US Male)", lang: "en-US" },
  { id: "en-US-Neural2-J", label: "Neural2 J (US Male)", lang: "en-US" },
  // English (GB) - Neural2
  { id: "en-GB-Neural2-A", label: "Neural2 A (British Female)", lang: "en-GB" },
  { id: "en-GB-Neural2-B", label: "Neural2 B (British Male)", lang: "en-GB" },
  { id: "en-GB-Neural2-C", label: "Neural2 C (British Female)", lang: "en-GB" },
  { id: "en-GB-Neural2-D", label: "Neural2 D (British Male)", lang: "en-GB" },
  { id: "en-GB-Neural2-F", label: "Neural2 F (British Female)", lang: "en-GB" },
  // German - Neural2
  { id: "de-DE-Neural2-G", label: "Neural2 G (German Female)", lang: "de-DE" },
  { id: "de-DE-Neural2-H", label: "Neural2 H (German Male)", lang: "de-DE" },
  // French - Neural2
  { id: "fr-FR-Neural2-F", label: "Neural2 F (French Female)", lang: "fr-FR" },
  { id: "fr-FR-Neural2-G", label: "Neural2 G (French Male)", lang: "fr-FR" },
  // Spanish - Neural2
  { id: "es-ES-Neural2-A", label: "Neural2 A (Spanish Female)", lang: "es-ES" },
  { id: "es-ES-Neural2-E", label: "Neural2 E (Spanish Female)", lang: "es-ES" },
  { id: "es-ES-Neural2-F", label: "Neural2 F (Spanish Male)", lang: "es-ES" },
  { id: "es-ES-Neural2-G", label: "Neural2 G (Spanish Male)", lang: "es-ES" },
  // Italian - Neural2
  { id: "it-IT-Neural2-A", label: "Neural2 A (Italian Female)", lang: "it-IT" },
  { id: "it-IT-Neural2-E", label: "Neural2 E (Italian Female)", lang: "it-IT" },
  { id: "it-IT-Neural2-F", label: "Neural2 F (Italian Male)", lang: "it-IT" },
  // Japanese - Neural2
  { id: "ja-JP-Neural2-B", label: "Neural2 B (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Neural2-C", label: "Neural2 C (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Neural2-D", label: "Neural2 D (Japanese Male)", lang: "ja-JP" },
  // Japanese - Wavenet
  { id: "ja-JP-Wavenet-A", label: "Wavenet A (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-B", label: "Wavenet B (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-C", label: "Wavenet C (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-D", label: "Wavenet D (Japanese Male)", lang: "ja-JP" },
  // Japanese - Standard
  { id: "ja-JP-Standard-A", label: "Standard A (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Standard-B", label: "Standard B (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Standard-C", label: "Standard C (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Standard-D", label: "Standard D (Japanese Male)", lang: "ja-JP" },
  // Korean - Neural2
  { id: "ko-KR-Neural2-A", label: "Neural2 A (Korean Female)", lang: "ko-KR" },
  { id: "ko-KR-Neural2-B", label: "Neural2 B (Korean Female)", lang: "ko-KR" },
  { id: "ko-KR-Neural2-C", label: "Neural2 C (Korean Male)", lang: "ko-KR" },
];

export function getVoicesForProvider(
  provider: "aws" | "google",
): VoiceOption[] {
  return provider === "google" ? VOICES_GOOGLE : VOICES;
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  VOICE: "Stephen",
  SPEED: 1.0,
  AWS_REGION: "eu-central-1",
  AWS_ACCESS_KEY_ID: "",
  AWS_SECRET_ACCESS_KEY: "",
  spellOutAcronyms: true,
  TTS_PROVIDER: "aws",
  GOOGLE_API_KEY: "",
};
