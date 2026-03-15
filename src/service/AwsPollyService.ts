import {
  PollyClient,
  SynthesizeSpeechCommand,
  DescribeVoicesCommand,
  Engine,
  LanguageCode,
  TextType,
  OutputFormat,
  VoiceId,
} from "@aws-sdk/client-polly";
import { VOICES } from "../settings/VoiceSettings";
import { BaseTTSService } from "./BaseTTSService";

interface AwsCredentials {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  region: string;
}

export class AwsPollyService extends BaseTTSService {
  private synthesizeInput: {
    Engine: Engine;
    LanguageCode: LanguageCode;
    SampleRate: string;
    TextType: TextType;
    OutputFormat: OutputFormat;
    VoiceId: VoiceId;
    Text: string;
  };
  private pollyClient: PollyClient;
  private currentCredentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  private pollyClientInitialized: boolean = false;

  constructor(awsConfig: AwsCredentials, voice: string, speed?: number) {
    super(voice, speed);

    this.currentCredentials = {
      accessKeyId: awsConfig.credentials.accessKeyId,
      secretAccessKey: awsConfig.credentials.secretAccessKey,
      region: awsConfig.region,
    };

    const engine = process.env.NODE_ENV === "test" ? "standard" : "neural";

    this.synthesizeInput = {
      Engine: engine as Engine,
      SampleRate: "24000",
      TextType: "text" as TextType,
      OutputFormat: "mp3" as OutputFormat,
      LanguageCode: this.getLanguageCode(voice) as LanguageCode,
      VoiceId: (voice || "Stephen") as VoiceId,
      Text: "No document selected.",
    };

    if (this.hasValidCredentials()) {
      this.initializePollyClient();
    }
  }

  private hasValidCredentials(): boolean {
    return (
      this.currentCredentials.accessKeyId !== "" &&
      this.currentCredentials.secretAccessKey !== "" &&
      this.currentCredentials.region !== ""
    );
  }

  private initializePollyClient(): void {
    this.pollyClient = new PollyClient({
      credentials: async () => {
        return {
          accessKeyId: this.currentCredentials.accessKeyId,
          secretAccessKey: this.currentCredentials.secretAccessKey,
        };
      },
      region: this.currentCredentials.region,
    });
    this.pollyClientInitialized = true;
  }

  async validateCredentials(): Promise<{
    isValid: boolean;
    error?: string;
    voiceCount?: number;
  }> {
    try {
      const command = new DescribeVoicesCommand({
        Engine: "neural",
        IncludeAdditionalLanguageCodes: false,
      });

      const response = await this.pollyClient.send(command);

      return {
        isValid: true,
        voiceCount: response.Voices?.length || 0,
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred";

      if (error && typeof error === "object" && "name" in error) {
        const awsError = error as {
          name: string;
          message?: string;
          code?: string;
        };

        if (awsError.name === "InvalidSignatureException") {
          errorMessage =
            "Invalid AWS credentials - please check your Access Key ID and Secret Access Key";
        } else if (awsError.name === "SignatureDoesNotMatchException") {
          errorMessage =
            "AWS Secret Access Key does not match the Access Key ID";
        } else if (awsError.name === "AccessDeniedException") {
          errorMessage =
            "Access denied - your AWS credentials don't have permission to use Polly";
        } else if (awsError.name === "UnrecognizedClientException") {
          errorMessage = "Invalid AWS Access Key ID format";
        } else if (
          awsError.name === "NetworkingError" ||
          awsError.code === "NetworkingError"
        ) {
          errorMessage =
            "Network error - please check your internet connection";
        } else if (awsError.name === "InvalidParameterValueException") {
          errorMessage = "Invalid AWS region specified";
        } else if (awsError.message) {
          errorMessage = awsError.message;
        }
      }

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  updateCredentials(awsConfig: AwsCredentials): void {
    this.currentCredentials = {
      accessKeyId: awsConfig.credentials.accessKeyId,
      secretAccessKey: awsConfig.credentials.secretAccessKey,
      region: awsConfig.region,
    };

    if (this.hasValidCredentials()) {
      this.initializePollyClient();
    }
  }

  protected async synthesize(
    ssml: string,
    abortSignal?: AbortSignal,
  ): Promise<Blob> {
    const input = {
      Engine: this.synthesizeInput.Engine,
      LanguageCode: this.synthesizeInput.LanguageCode,
      SampleRate: this.synthesizeInput.SampleRate,
      TextType: "ssml" as TextType,
      OutputFormat: this.synthesizeInput.OutputFormat,
      Text: ssml,
      VoiceId: this.synthesizeInput.VoiceId,
    };

    const command = new SynthesizeSpeechCommand(input);
    const data = await this.pollyClient.send(command, {
      abortSignal,
    });

    if (!data || !data.AudioStream) {
      throw new Error("Invalid response from Polly");
    }

    const audioStream = data.AudioStream;

    if (
      typeof audioStream === "object" &&
      audioStream !== null &&
      "getReader" in audioStream
    ) {
      const readableStream = audioStream as ReadableStream<Uint8Array>;
      const reader = readableStream.getReader();
      const blobParts: BlobPart[] = [];

      while (true) {
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new Error("AbortError");
        }

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new Uint8Array(value.length);
        chunk.set(value);
        blobParts.push(chunk);
      }

      return new Blob(blobParts, { type: "audio/mpeg" });
    }

    // Handle Node.js streams (for testing)
    if (Symbol.asyncIterator in audioStream) {
      const chunks: Buffer[] = [];
      const asyncIterable = audioStream as AsyncIterable<Buffer>;
      for await (const chunk of asyncIterable) {
        if (abortSignal?.aborted) {
          throw new Error("AbortError");
        }
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);
      return new Blob([audioBuffer], { type: "audio/mpeg" });
    }

    throw new Error("Unsupported audio stream format");
  }

  setVoice(voice: string) {
    this.synthesizeInput.VoiceId = voice as VoiceId;
    this.synthesizeInput.LanguageCode = this.getLanguageCode(
      voice,
    ) as LanguageCode;
    super.setVoice(voice);
  }

  getLanguageCode(voice: string): string {
    const voiceOption = VOICES.find((v) => v.id === voice);
    return voiceOption ? voiceOption.lang : "en-US";
  }

  getVoice(): string {
    return this.synthesizeInput.VoiceId;
  }

  getContent() {
    return this.synthesizeInput.Text;
  }

  setSynthesizeInput(synthesizeInput: Partial<typeof this.synthesizeInput>) {
    this.synthesizeInput = {
      ...this.synthesizeInput,
      ...synthesizeInput,
    };
  }

  setAudio(text: string) {
    this.synthesizeInput.Text = text;
  }

  setLanguageCode(language: string) {
    this.synthesizeInput.LanguageCode = language as LanguageCode;
    this.voiceChanged = true;
  }

  protected reportError(error: unknown) {
    if (this.errorCallback) {
      let errorMessage = "Network error. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const errorObj = error as { message: string };

        if (errorObj.message.includes("NetworkingError")) {
          errorMessage = "Connection failed. Check your internet.";
        } else if (errorObj.message.includes("InvalidAccessKeyId")) {
          errorMessage = "Invalid AWS credentials.";
        } else if (errorObj.message.includes("ThrottlingException")) {
          errorMessage = "Rate limited. Please wait and try again.";
        } else if (errorObj.message.includes("TextLengthExceededException")) {
          errorMessage = "Text too long. Try shorter content.";
        } else {
          errorMessage = `AWS Error: ${errorObj.message}`;
        }
      }

      this.errorCallback(errorMessage);
    }
  }
}
