import { BaseTTSService } from "./BaseTTSService";
import { VOICES_GOOGLE } from "../settings/VoiceSettings";

export class GoogleTTSService extends BaseTTSService {
  private apiKey: string;

  constructor(apiKey: string, voice: string, speed?: number) {
    super(voice, speed);
    this.apiKey = apiKey;
    // Google TTS limit is 5000 bytes; Japanese is ~3 bytes/char in UTF-8
    // Use 1500 chars to stay safely under 5000 bytes with SSML markup
    this.maxChunkSize = 1500;
  }

  protected async synthesize(
    ssml: string,
    abortSignal?: AbortSignal,
  ): Promise<Blob> {
    const languageCode = this.getLanguageCode(this.voice);

    const requestBody = {
      input: { ssml },
      voice: {
        languageCode,
        name: this.voice,
      },
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 24000,
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.error?.message || `Google TTS API error: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("No audio content in Google TTS response");
    }

    // Decode base64 audio content
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: "audio/mpeg" });
  }

  async validateCredentials(): Promise<{
    isValid: boolean;
    error?: string;
    voiceCount?: number;
  }> {
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?key=${encodeURIComponent(this.apiKey)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.error?.message ||
          `API error: ${response.status}`;

        if (response.status === 400 || response.status === 403) {
          return {
            isValid: false,
            error: `Invalid API key - ${message}`,
          };
        }

        return {
          isValid: false,
          error: message,
        };
      }

      const data = await response.json();
      return {
        isValid: true,
        voiceCount: data.voices?.length || 0,
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred";

      if (error && typeof error === "object" && "message" in error) {
        const errObj = error as { message: string };
        if (
          errObj.message.includes("fetch") ||
          errObj.message.includes("network")
        ) {
          errorMessage =
            "Network error - please check your internet connection";
        } else {
          errorMessage = errObj.message;
        }
      }

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  getLanguageCode(voice: string): string {
    const voiceOption = VOICES_GOOGLE.find((v) => v.id === voice);
    return voiceOption ? voiceOption.lang : "en-US";
  }

  updateCredentials(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
