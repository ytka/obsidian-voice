import { GoogleTTSService } from "../src/service/GoogleTTSService";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock atob for base64 decoding
global.atob = (str: string) => Buffer.from(str, "base64").toString("binary");

describe("GoogleTTSService", () => {
  let service: GoogleTTSService;

  beforeEach(() => {
    service = new GoogleTTSService("test-api-key", "ja-JP-Neural2-B", 1.0);
    mockFetch.mockReset();
  });

  describe("synthesize", () => {
    it("should call Google TTS API and return audio blob", async () => {
      const fakeAudioBase64 = Buffer.from("fake-audio-data").toString(
        "base64",
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ audioContent: fakeAudioBase64 }),
      });

      // Access protected method through any cast
      const blob = await (service as any).synthesize(
        "<speak>こんにちは</speak>",
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
      );
      expect(url).toContain("key=test-api-key");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.input.ssml).toBe("<speak>こんにちは</speak>");
      expect(body.voice.name).toBe("ja-JP-Neural2-B");
      expect(body.voice.languageCode).toBe("ja-JP");
      expect(body.audioConfig.audioEncoding).toBe("MP3");

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("audio/mpeg");
    });

    it("should throw on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: "Invalid request" },
        }),
      });

      await expect(
        (service as any).synthesize("<speak>test</speak>"),
      ).rejects.toThrow("Invalid request");
    });

    it("should throw when no audio content returned", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        (service as any).synthesize("<speak>test</speak>"),
      ).rejects.toThrow("No audio content in Google TTS response");
    });
  });

  describe("validateCredentials", () => {
    it("should return valid when API responds with voices", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          voices: [
            { name: "ja-JP-Neural2-B" },
            { name: "en-US-Neural2-A" },
          ],
        }),
      });

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(true);
      expect(result.voiceCount).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://texttospeech.googleapis.com/v1/voices?key=test-api-key",
        ),
      );
    });

    it("should return invalid for 403 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: "API key not valid" },
        }),
      });

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid API key");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getLanguageCode", () => {
    it("should return correct language code for known voice", () => {
      expect(service.getLanguageCode("ja-JP-Neural2-B")).toBe("ja-JP");
      expect(service.getLanguageCode("en-US-Neural2-A")).toBe("en-US");
    });

    it("should return en-US for unknown voice", () => {
      expect(service.getLanguageCode("unknown-voice")).toBe("en-US");
    });
  });

  describe("updateCredentials", () => {
    it("should update API key", async () => {
      service.updateCredentials("new-api-key");

      const fakeAudioBase64 = Buffer.from("audio").toString("base64");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ audioContent: fakeAudioBase64 }),
      });

      await (service as any).synthesize("<speak>test</speak>");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("key=new-api-key");
    });
  });
});
