import { TTSService } from "../service/TTSService";
import { MarkdownHelper } from "./MarkdownHelper";
import { IconEventHandler } from "./IconEventHandler";
import { MarkdownToSSMLProcessor } from "../processors/MarkdownToSSMLProcessor";
import { Notice } from "obsidian";

export class TextSpeaker {
  private ttsService: TTSService;
  private markdownHelper: MarkdownHelper;
  private iconEventHandler: IconEventHandler;
  private ssmlProcessor: MarkdownToSSMLProcessor;
  private spellOutAcronyms: boolean;

  constructor(
    ttsService: TTSService,
    markdownHelper: MarkdownHelper,
    iconEventHandler: IconEventHandler,
    spellOutAcronyms: boolean = true,
  ) {
    this.ttsService = ttsService;
    this.markdownHelper = markdownHelper;
    this.iconEventHandler = iconEventHandler;
    this.spellOutAcronyms = spellOutAcronyms;

    this.ssmlProcessor = new MarkdownToSSMLProcessor({
      voiceType: "neural",
      spellOutAcronyms: this.spellOutAcronyms,
    });
  }

  async speakText(speed?: number): Promise<void> {
    this.iconEventHandler.ribbonIconHandler();

    if (this.ttsService.isPlaying()) {
      this.ttsService.pauseAudio();
      return;
    }

    // Replay or resume from cached audio if available
    const audio = this.ttsService.getAudio();
    if (audio.src && audio.duration > 0 && !this.ttsService.hasVoiceChanged()) {
      if (audio.ended) {
        audio.currentTime = 0;
      }
      this.ttsService.playAudio(speed);
      return;
    }

    if (this.ttsService.isOperationInProgress()) {
      return;
    }

    const requestId = this.ttsService.startOperation();

    try {
      const rawText = await this.markdownHelper.getMarkdownView();

      if (!this.ttsService.isCurrentRequest(requestId)) {
        return;
      }

      const processingNotice = new Notice("Processing text...", 2000);
      const result = await this.ssmlProcessor.process(rawText);
      processingNotice.hide();

      if (!this.ttsService.isCurrentRequest(requestId)) {
        return;
      }

      if (!result.isValid) {
        console.error("SSML validation errors:", result.errors);
        new Notice(
          `Voice Plugin: SSML validation failed\n${result.errors.join("\n")}`,
        );
        return;
      }

      if (result.warnings.length > 0) {
        console.warn("SSML warnings:", result.warnings);
      }

      const activeFilePath = this.markdownHelper.getActiveFilePath();

      await this.ttsService.playSSMLAudio(
        result.ssml,
        speed,
        activeFilePath || undefined,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Error in text-to-speech processing:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Voice Plugin Error: ${errorMessage}`);
    } finally {
      this.ttsService.endOperation(requestId);
    }
  }
}
