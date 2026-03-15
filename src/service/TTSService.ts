export interface TTSService {
  playSSMLAudio(ssml: string, speed?: number, filePath?: string): Promise<void>;
  playAudio(speed?: number): Promise<void>;
  pauseAudio(): void;
  stopAudio(): void;
  rewindAudio(): void;
  fastForwardAudio(): void;

  startOperation(): string;
  endOperation(requestId: string): void;
  isOperationInProgress(): boolean;
  cancelOperation(): void;
  isCurrentRequest(requestId: string): boolean;

  setVoice(voice: string): void;
  setSpeed(speed: number): number;
  setProgressCallback(callback: (progress: number) => void): void;
  setErrorCallback(callback: (error: string) => void): void;

  getVoice(): string;
  getSpeed(): number;
  getAudio(): HTMLAudioElement;
  getDuration(): number;
  getCurrentTime(): number;
  isPlaying(): boolean;
  hasEnded(): boolean;
  getVolume(): number;
  getContent(): string;

  getLastGeneratedAudio(filePath?: string): Blob | null;
  setCachedAudio(audioBlob: Blob, filePath: string): void;
  clearCachedAudio(): void;

  validateCredentials(): Promise<{
    isValid: boolean;
    error?: string;
    voiceCount?: number;
  }>;
  updatePlaybackRate(speed: number): void;
  hasVoiceChanged(): boolean;
  getLanguageCode(voice: string): string;

  /** @deprecated Use isOperationInProgress() instead */
  isLoadingInProgress(): boolean;
  /** @deprecated Use cancelOperation() instead */
  cancelLoading(): void;
}
