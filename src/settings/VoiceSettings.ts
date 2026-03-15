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
  // Japanese
  { id: "ja-JP-Neural2-B", label: "Neural2 B (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Neural2-C", label: "Neural2 C (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Neural2-D", label: "Neural2 D (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-A", label: "Wavenet A (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-B", label: "Wavenet B (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-C", label: "Wavenet C (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Wavenet-D", label: "Wavenet D (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Standard-A", label: "Standard A (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Standard-B", label: "Standard B (Japanese Female)", lang: "ja-JP" },
  { id: "ja-JP-Standard-C", label: "Standard C (Japanese Male)", lang: "ja-JP" },
  { id: "ja-JP-Standard-D", label: "Standard D (Japanese Male)", lang: "ja-JP" },
  // English (US)
  { id: "en-US-Neural2-A", label: "Neural2 A (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-C", label: "Neural2 C (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-D", label: "Neural2 D (US Male)", lang: "en-US" },
  { id: "en-US-Neural2-F", label: "Neural2 F (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-H", label: "Neural2 H (US Female)", lang: "en-US" },
  { id: "en-US-Neural2-I", label: "Neural2 I (US Male)", lang: "en-US" },
  { id: "en-US-Neural2-J", label: "Neural2 J (US Male)", lang: "en-US" },
  { id: "en-US-Wavenet-A", label: "Wavenet A (US Male)", lang: "en-US" },
  { id: "en-US-Wavenet-B", label: "Wavenet B (US Male)", lang: "en-US" },
  { id: "en-US-Wavenet-C", label: "Wavenet C (US Female)", lang: "en-US" },
  { id: "en-US-Wavenet-D", label: "Wavenet D (US Male)", lang: "en-US" },
  { id: "en-US-Wavenet-F", label: "Wavenet F (US Female)", lang: "en-US" },
  // English (GB)
  { id: "en-GB-Neural2-A", label: "Neural2 A (British Female)", lang: "en-GB" },
  { id: "en-GB-Neural2-B", label: "Neural2 B (British Male)", lang: "en-GB" },
  { id: "en-GB-Neural2-C", label: "Neural2 C (British Female)", lang: "en-GB" },
  { id: "en-GB-Neural2-D", label: "Neural2 D (British Male)", lang: "en-GB" },
  { id: "en-GB-Neural2-F", label: "Neural2 F (British Female)", lang: "en-GB" },
  // German
  { id: "de-DE-Neural2-B", label: "Neural2 B (German Male)", lang: "de-DE" },
  { id: "de-DE-Neural2-C", label: "Neural2 C (German Female)", lang: "de-DE" },
  { id: "de-DE-Neural2-D", label: "Neural2 D (German Male)", lang: "de-DE" },
  { id: "de-DE-Neural2-F", label: "Neural2 F (German Female)", lang: "de-DE" },
  // French
  { id: "fr-FR-Neural2-A", label: "Neural2 A (French Female)", lang: "fr-FR" },
  { id: "fr-FR-Neural2-B", label: "Neural2 B (French Male)", lang: "fr-FR" },
  { id: "fr-FR-Neural2-C", label: "Neural2 C (French Female)", lang: "fr-FR" },
  { id: "fr-FR-Neural2-D", label: "Neural2 D (French Male)", lang: "fr-FR" },
  // Spanish
  { id: "es-ES-Neural2-A", label: "Neural2 A (Spanish Female)", lang: "es-ES" },
  { id: "es-ES-Neural2-B", label: "Neural2 B (Spanish Male)", lang: "es-ES" },
  { id: "es-ES-Neural2-C", label: "Neural2 C (Spanish Female)", lang: "es-ES" },
  { id: "es-ES-Neural2-D", label: "Neural2 D (Spanish Female)", lang: "es-ES" },
  // Italian
  { id: "it-IT-Neural2-A", label: "Neural2 A (Italian Female)", lang: "it-IT" },
  { id: "it-IT-Neural2-C", label: "Neural2 C (Italian Male)", lang: "it-IT" },
  // Korean
  { id: "ko-KR-Neural2-A", label: "Neural2 A (Korean Female)", lang: "ko-KR" },
  { id: "ko-KR-Neural2-B", label: "Neural2 B (Korean Female)", lang: "ko-KR" },
  { id: "ko-KR-Neural2-C", label: "Neural2 C (Korean Male)", lang: "ko-KR" },
  // Chinese (Mandarin)
  { id: "cmn-CN-Neural2-A", label: "Neural2 A (Mandarin Female)", lang: "cmn-CN" },
  { id: "cmn-CN-Neural2-B", label: "Neural2 B (Mandarin Male)", lang: "cmn-CN" },
  { id: "cmn-CN-Neural2-C", label: "Neural2 C (Mandarin Male)", lang: "cmn-CN" },
  { id: "cmn-CN-Neural2-D", label: "Neural2 D (Mandarin Female)", lang: "cmn-CN" },
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
