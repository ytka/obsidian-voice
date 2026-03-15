import { TTSService } from "./TTSService";

export abstract class BaseTTSService implements TTSService {
  protected audio: HTMLAudioElement;
  protected speed: number;
  protected voice: string;
  protected voiceChanged: boolean;
  protected progressCallback?: (progress: number) => void;
  protected errorCallback?: (error: string) => void;
  protected abortController?: AbortController;
  protected isLoading: boolean = false;
  protected lastGeneratedAudio: Blob | null = null;
  protected lastGeneratedAudioFilePath: string | null = null;
  protected currentRequestId: string | null = null;
  protected currentContent: string = "No document selected.";
  protected maxChunkSize: number = 2500;

  constructor(voice: string, speed?: number) {
    this.speed = speed || 1.0;
    this.voice = voice || "Stephen";
    this.audio = new Audio();
    this.audio.src = "";
    this.voiceChanged = false;
  }

  protected abstract synthesize(
    ssml: string,
    abortSignal?: AbortSignal,
  ): Promise<Blob>;

  abstract validateCredentials(): Promise<{
    isValid: boolean;
    error?: string;
    voiceCount?: number;
  }>;

  abstract getLanguageCode(voice: string): string;

  async playSSMLAudio(
    ssml: string,
    speed?: number,
    filePath?: string,
  ): Promise<void> {
    try {
      const { chunkSSML, validateChunks } = await import(
        "../processors/pipeline/SSMLChunker"
      );

      if (ssml.length > this.maxChunkSize) {
        const chunks = chunkSSML(ssml, this.maxChunkSize);
        const validation = validateChunks(chunks);
        if (!validation.isValid) {
          console.error("Chunk validation errors:", validation.errors);
          throw new Error(
            `SSML chunking failed: ${validation.errors.join(", ")}`,
          );
        }
        await this.playSSMLChunks(chunks, speed, filePath);
      } else {
        if (ssml === this.currentContent && !this.voiceChanged) {
          this.playAudio(speed);
        } else {
          this.currentContent = ssml;
          await this.synthesizeAndPlay(ssml, speed, filePath);
        }
      }

      this.voiceChanged = false;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error in playSSMLAudio:", error);
      this.reportError(error);
      throw error;
    }
  }

  private async playSSMLChunks(
    chunks: Array<{ ssml: string; index: number; total: number }>,
    speed?: number,
    filePath?: string,
  ): Promise<void> {
    const audioBlobs: Blob[] = [];

    for (const chunk of chunks) {
      if (this.abortController?.signal.aborted) {
        throw new Error("AbortError");
      }

      const baseProgress = chunk.index / chunk.total;
      const chunkProgress = 1 / chunk.total;
      this.reportProgress(baseProgress + chunkProgress * 0.9, 1);

      try {
        const blob = await this.synthesize(
          chunk.ssml,
          this.abortController?.signal,
        );
        audioBlobs.push(blob);
      } catch (error) {
        console.error(`[Voice] Chunk ${chunk.index}/${chunk.total} failed. SSML:`, chunk.ssml);
        throw error;
      }
    }

    const finalBlob = new Blob(audioBlobs, { type: "audio/mpeg" });
    this.lastGeneratedAudio = finalBlob;
    if (filePath) {
      this.lastGeneratedAudioFilePath = filePath;
    }
    this.audio.src = URL.createObjectURL(finalBlob);
    this.reportProgress(1, 1);
    this.playAudio(speed);
  }

  private async synthesizeAndPlay(
    ssml: string,
    speed?: number,
    filePath?: string,
  ): Promise<void> {
    if (this.isLoading) {
      throw new Error(
        "TTS call already in progress. This should not happen if startOperation() guard is working.",
      );
    }

    this.isLoading = true;

    try {
      this.reportProgress(0, 1);

      const audioBlob = await this.synthesize(
        ssml,
        this.abortController?.signal,
      );

      if (this.abortController?.signal.aborted) {
        throw new Error("AbortError");
      }

      this.lastGeneratedAudio = audioBlob;
      if (filePath) {
        this.lastGeneratedAudioFilePath = filePath;
      }
      this.audio.src = URL.createObjectURL(audioBlob);
      this.reportProgress(1, 1);
      this.playAudio(speed);
    } finally {
      this.isLoading = false;
      this.abortController = undefined;
    }
  }

  async playAudio(speed?: number) {
    let fSpeed =
      typeof speed === "number" ? parseFloat(speed.toFixed(2)) : this.speed;

    if (fSpeed < 0.5) {
      fSpeed = 0.5;
    } else if (fSpeed > 2) {
      fSpeed = 2;
    }

    this.audio.playbackRate = fSpeed;
    this.audio.play();
  }

  pauseAudio() {
    this.audio.pause();
  }

  stopAudio() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = "";
    this.clearCachedAudio();
  }

  rewindAudio() {
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, this.audio.currentTime - 3);
    }
  }

  fastForwardAudio() {
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.min(
        this.audio.duration,
        this.audio.currentTime + 3,
      );
    }
  }

  isOperationInProgress(): boolean {
    return this.currentRequestId !== null;
  }

  startOperation(): string {
    if (this.currentRequestId !== null) {
      throw new Error(
        `Operation already in progress: ${this.currentRequestId}`,
      );
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.currentRequestId = requestId;
    this.abortController = new AbortController();

    return requestId;
  }

  isCurrentRequest(requestId: string): boolean {
    return this.currentRequestId === requestId;
  }

  cancelOperation(): void {
    if (this.currentRequestId && this.abortController) {
      this.abortController.abort();
      this.currentRequestId = null;
      this.isLoading = false;
      this.abortController = undefined;

      this.reportProgress(0, 1);
    }
  }

  endOperation(requestId: string): void {
    if (this.currentRequestId === requestId) {
      this.currentRequestId = null;
      this.isLoading = false;
      this.abortController = undefined;
    } else if (this.currentRequestId !== null) {
      console.warn(
        `[Voice] Attempted to end operation ${requestId} but current is ${this.currentRequestId}`,
      );
    }
  }

  /** @deprecated Use isOperationInProgress() instead */
  isLoadingInProgress(): boolean {
    return this.isOperationInProgress();
  }

  /** @deprecated Use cancelOperation() instead */
  cancelLoading(): void {
    this.cancelOperation();
  }

  setSpeed(speed: number): number {
    this.speed = speed;
    this.updatePlaybackRate(speed);
    return this.speed;
  }

  setProgressCallback(callback: (progress: number) => void) {
    this.progressCallback = callback;
  }

  setErrorCallback(callback: (error: string) => void) {
    this.errorCallback = callback;
  }

  setVoice(voice: string) {
    this.voice = voice;
    this.voiceChanged = true;
  }

  updatePlaybackRate(speed: number) {
    if (this.audio && this.audio.src) {
      let fSpeed =
        typeof speed === "number" ? parseFloat(speed.toFixed(2)) : this.speed;

      if (fSpeed < 0.5) {
        fSpeed = 0.5;
      } else if (fSpeed > 2) {
        fSpeed = 2;
      }

      this.audio.playbackRate = fSpeed;
    }
  }

  hasVoiceChanged(): boolean {
    return this.voiceChanged;
  }

  isPlaying() {
    return !this.audio.paused;
  }

  hasEnded() {
    return this.audio.ended;
  }

  getVoice(): string {
    return this.voice;
  }

  getContent() {
    return this.currentContent;
  }

  getAudio() {
    return this.audio;
  }

  getSpeed() {
    return this.speed;
  }

  getDuration() {
    return this.audio.duration;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getVolume() {
    return this.audio.volume;
  }

  getLastGeneratedAudio(filePath?: string): Blob | null {
    if (filePath && this.lastGeneratedAudioFilePath !== filePath) {
      return null;
    }
    return this.lastGeneratedAudio;
  }

  clearCachedAudio(): void {
    this.lastGeneratedAudio = null;
    this.lastGeneratedAudioFilePath = null;
  }

  setCachedAudio(audioBlob: Blob, filePath: string): void {
    this.lastGeneratedAudio = audioBlob;
    this.lastGeneratedAudioFilePath = filePath;
  }

  protected reportProgress(current: number, total: number) {
    if (this.progressCallback) {
      const progress = total > 0 ? current / total : 0;
      this.progressCallback(Math.min(1, Math.max(0, progress)));
    }
  }

  protected reportError(error: unknown) {
    if (this.errorCallback) {
      let errorMessage = "Network error. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const errorObj = error as { message: string };
        errorMessage = errorObj.message;
      }

      this.errorCallback(errorMessage);
    }
  }
}
