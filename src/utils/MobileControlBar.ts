import { App, setIcon, Notice, Menu } from "obsidian";
import { Voice } from "./VoicePlugin";
import { TTSService } from "../service/TTSService";
import { AudioFileManager } from "./AudioFileManager";
import { getVoicesForProvider } from "../settings/VoiceSettings";

export class MobileControlBar {
  private app: App;
  private plugin: Voice;
  private ttsService: TTSService;
  private containerEl: HTMLElement | null = null;
  private isVisible: boolean = false;
  private playPauseIconEl: HTMLElement | null = null;
  private downloadIconEl: HTMLElement | null = null;
  private speedDisplayEl: HTMLElement | null = null;
  private progressBarContainer: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private isErrorState: boolean = false;
  private audioFileManager: AudioFileManager;

  constructor(app: App, plugin: Voice, ttsService: TTSService) {
    this.app = app;
    this.plugin = plugin;
    this.ttsService = ttsService;
    this.audioFileManager = new AudioFileManager(app);
    this.createOverlayBar();
    this.initializeEventListeners();

    this.app.workspace.on("active-leaf-change", () => {
      this.updateDownloadButtonVisibility();
    });
  }

  public updateService(ttsService: TTSService): void {
    this.ttsService = ttsService;
    this.initializeEventListeners();
  }

  private createOverlayBar(): void {
    this.containerEl = document.body.createDiv({
      cls: "voice-mobile-overlay",
    });

    this.addControlButtons();
    this.hide();
    this.addMobileOverlayStyles();
  }

  private addControlButtons(): void {
    if (!this.containerEl) return;

    this.createProgressBar();

    const controlsWrapper = this.containerEl.createDiv({
      cls: "voice-mobile-controls",
    });

    // Voice Switcher
    this.createControlButton(
      controlsWrapper,
      "mic",
      "Change Voice",
      (event: MouseEvent) => {
        const menu = new Menu();
        const voices = getVoicesForProvider(this.plugin.settings.TTS_PROVIDER);

        voices.forEach((voice) => {
          menu.addItem((item) =>
            item
              .setTitle(voice.label)
              .setChecked(voice.id === this.ttsService.getVoice())
              .onClick(async () => {
                this.plugin.settings.VOICE = voice.id;
                await this.plugin.saveSettings();
                this.ttsService.setVoice(voice.id);
                this.plugin.iconEventHandler.updateVoiceDisplay();
              }),
          );
        });

        menu.showAtMouseEvent(event);
      },
    );

    // Download MP3
    this.downloadIconEl = this.createControlButton(
      controlsWrapper,
      "download",
      "Download Audio",
      () => this.handleDownloadAudio(),
    );
    this.downloadIconEl.style.display = "none";

    // Rewind
    this.createControlButton(controlsWrapper, "rewind", "Rewind", () =>
      this.ttsService.rewindAudio(),
    );

    // Stop
    this.createControlButton(controlsWrapper, "square", "Stop", () => {
      if (this.ttsService.isOperationInProgress()) {
        this.ttsService.cancelOperation();
        this.resetToPlayState();
        this.hideProgressBar();
        setTimeout(() => this.hide(), 3000);
        return;
      }
      this.ttsService.stopAudio();
      setTimeout(() => this.hide(), 3000);
    });

    // Speed controls group
    const speedGroup = controlsWrapper.createDiv({
      cls: "voice-mobile-speed-group",
    });

    this.createControlButton(speedGroup, "minus", "Slower", () =>
      this.decreaseSpeed(),
    );

    this.speedDisplayEl = speedGroup.createDiv({
      cls: "voice-mobile-speed-display",
    });
    this.updateSpeedDisplay();

    this.createControlButton(speedGroup, "plus", "Faster", () =>
      this.increaseSpeed(),
    );

    // Play/Pause
    this.playPauseIconEl = this.createControlButton(
      controlsWrapper,
      "play",
      "Play/Pause",
      () => {
        if (this.ttsService.isOperationInProgress()) {
          this.ttsService.cancelOperation();
          this.resetToPlayState();
          this.hideProgressBar();
          return;
        }

        if (!this.ttsService.isPlaying()) {
          this.showLoadingState();
        }
        this.plugin.speakText();
      },
    );
    this.playPauseIconEl?.addClass("voice-mobile-primary-btn");

    // Fast-forward
    this.createControlButton(
      controlsWrapper,
      "fast-forward",
      "Fast Forward",
      () => this.ttsService.fastForwardAudio(),
    );
  }

  private createControlButton(
    parent: HTMLElement,
    icon: string,
    title: string,
    onClick: (e: MouseEvent) => void,
  ): HTMLElement {
    const button = parent.createEl("button", {
      cls: "voice-mobile-control-btn",
      attr: { title },
    });

    setIcon(button, icon);
    button.addEventListener("click", onClick);

    return button;
  }

  private createProgressBar(): void {
    if (!this.containerEl) return;

    this.progressBarContainer = this.containerEl.createDiv({
      cls: "voice-mobile-progress-container",
    });

    this.progressBar = this.progressBarContainer.createDiv({
      cls: "voice-mobile-progress-bar",
    });

    this.hideProgressBar();
  }

  private updateSpeedDisplay(): void {
    if (this.speedDisplayEl) {
      const currentSpeed = this.ttsService.getSpeed();
      this.speedDisplayEl.textContent = `${currentSpeed.toFixed(1)}x`;
    }
  }

  private decreaseSpeed(): void {
    const currentSpeed = this.ttsService.getSpeed();
    const newSpeed = Math.max(0.5, Math.round((currentSpeed - 0.1) * 10) / 10);

    if (newSpeed !== currentSpeed) {
      this.ttsService.setSpeed(newSpeed);
      this.plugin.settings.SPEED = newSpeed;
      this.plugin.saveSettings();
      this.updateSpeedDisplay();
    }
  }

  private increaseSpeed(): void {
    const currentSpeed = this.ttsService.getSpeed();
    const newSpeed = Math.min(1.9, Math.round((currentSpeed + 0.1) * 10) / 10);

    if (newSpeed !== currentSpeed) {
      this.ttsService.setSpeed(newSpeed);
      this.plugin.settings.SPEED = newSpeed;
      this.plugin.saveSettings();
      this.updateSpeedDisplay();
    }
  }

  private showLoadingState(): void {
    if (this.playPauseIconEl) {
      this.playPauseIconEl.addClass("rotating-icon");
      setIcon(this.playPauseIconEl, "refresh-ccw");
    }
    this.showProgressBar();
    this.updateProgressBar(0);
  }

  private resetToPlayState(): void {
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "play");
    }
  }

  private showProgressBar(): void {
    if (this.progressBarContainer) {
      this.progressBarContainer.addClass("visible");
      this.progressBarContainer.removeClass("error");
      this.isErrorState = false;
    }
  }

  private hideProgressBar(): void {
    if (this.progressBarContainer) {
      this.progressBarContainer.removeClass("visible");
      this.progressBarContainer.removeClass("error");
      this.isErrorState = false;
    }
  }

  private showErrorState(): void {
    if (this.progressBarContainer) {
      this.progressBarContainer.addClass("visible");
      this.progressBarContainer.addClass("error");
      this.isErrorState = true;
    }
  }

  private updateProgressBar(progress: number): void {
    if (this.progressBar && !this.isErrorState) {
      const percentage = Math.min(100, Math.max(0, progress * 100));
      this.progressBar.style.width = `${percentage}%`;
    }
  }

  private initializeEventListeners(): void {
    const audio = this.ttsService.getAudio();
    audio.addEventListener("play", () => this.onPlay());
    audio.addEventListener("pause", () => this.onPause());
    audio.addEventListener("ended", () => this.onEnded());
    audio.addEventListener("canplaythrough", () => this.onCanPlayThrough());
  }

  private onPlay(): void {
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "pause");
    }
    this.hideProgressBar();
    this.show();
    this.showDownloadButton();
  }

  private onPause(): void {
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "play");
    }
    this.hideProgressBar();

    setTimeout(() => {
      if (!this.ttsService.isPlaying()) {
        this.hide();
      }
    }, 3000);
  }

  private onCanPlayThrough(): void {
    this.hideProgressBar();
  }

  private onEnded(): void {
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "play");
    }
    this.hideProgressBar();
    setTimeout(() => this.hide(), 3000);
  }

  private handleError(): void {
    this.showErrorState();
    this.resetToPlayState();

    setTimeout(() => {
      this.hideProgressBar();
    }, 3000);
  }

  show(): void {
    if (this.containerEl && !this.isVisible) {
      this.containerEl.style.display = "flex";
      this.isVisible = true;
    }
  }

  hide(): void {
    if (this.containerEl && this.isVisible) {
      this.containerEl.style.display = "none";
      this.isVisible = false;
    }
  }

  public showLoadingStateFromExternal(): void {
    this.show();
    this.showLoadingState();
  }

  public updateProgressFromExternal(progress: number): void {
    this.updateProgressBar(progress);
  }

  public handleErrorFromExternal(): void {
    this.handleError();
  }

  private showDownloadButton(): void {
    if (this.downloadIconEl) {
      this.downloadIconEl.style.display = "";
    }
  }

  private hideDownloadButton(): void {
    if (this.downloadIconEl) {
      this.downloadIconEl.style.display = "none";
    }
  }

  public updateDownloadButtonVisibility(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      this.hideDownloadButton();
      return;
    }

    const audioBlob = this.ttsService.getLastGeneratedAudio(activeFile.path);
    if (audioBlob) {
      this.showDownloadButton();
    } else {
      this.hideDownloadButton();
    }
  }

  private async handleDownloadAudio(): Promise<void> {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("No active file found");
        return;
      }

      const audioBlob = this.ttsService.getLastGeneratedAudio(
        activeFile.path,
      );

      if (!audioBlob) {
        new Notice(
          "No audio available for this file. Please generate audio first.",
        );
        return;
      }

      await this.audioFileManager.downloadAndEmbed(audioBlob);
    } catch (error) {
      console.error("Error downloading audio:", error);
      new Notice(`Failed to download audio: ${error.message}`);
    }
  }

  private addMobileOverlayStyles(): void {
    if (document.getElementById("voice-mobile-overlay-styles")) return;

    const style = document.createElement("style");
    style.id = "voice-mobile-overlay-styles";
    style.textContent = `
      .voice-mobile-overlay {
        position: fixed;
        bottom: calc(var(--safe-area-inset-bottom, 0px) + var(--mobile-navbar-height, 58px));
        left: 0;
        right: 0;
        background: var(--background-primary);
        border-top: none;
        border-radius: 0;
        padding: 8px 12px;
        display: none;
        flex-direction: column;
        gap: 6px;
        z-index: 999;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        margin: 0;
        max-width: 100vw;
        transform: translateY(2px);
      }

      .voice-mobile-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }

      .voice-mobile-speed-group {
        display: flex;
        align-items: center;
        gap: 2px;
        background: var(--nav-item-background);
        border: none !important;
        padding: 1px;
      }

      .voice-mobile-control-btn {
        background: var(--background-primary) !important;
        background-color: var(--background-primary) !important;
        border: none;
        color: var(--interactive-accent);
        padding: 6px;
        border-radius: var(--radius-s);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 66px;
        min-height: 36px;
        transition: all 0.15s ease;
        opacity: 1;
      }

      .voice-mobile-control-btn svg {
        color: var(--interactive-accent);
        fill: currentColor;
        stroke: currentColor;
      }

      .voice-mobile-control-btn:hover {
        background: var(--background-modifier-hover) !important;
        color: var(--interactive-accent);
        opacity: 1;
        transform: scale(1.05);
      }

      .voice-mobile-control-btn:hover svg {
        color: var(--interactive-accent);
        fill: currentColor;
        stroke: currentColor;
      }

      .voice-mobile-control-btn:active {
        background: var(--background-modifier-active);
        color: var(--interactive-accent);
        transform: scale(0.98);
        opacity: 1;
      }

      .voice-mobile-control-btn:active svg {
        color: var(--interactive-accent);
        fill: currentColor;
        stroke: currentColor;
      }

      .voice-mobile-primary-btn {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-radius: 50%;
        min-width: 36px;
        min-height: 36px;
        opacity: 1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }

      .voice-mobile-primary-btn:hover {
        background: var(--interactive-accent-hover);
        transform: scale(1.08);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.32);
      }

      .voice-mobile-primary-btn:active {
        background: var(--interactive-accent);
        transform: scale(0.95);
      }

      .voice-mobile-speed-display {
        background: transparent;
        color: var(--interactive-accent);
        padding: 4px 8px;
        border-radius: var(--radius-s);
        font-size: 11px;
        font-weight: 500;
        min-width: 36px;
        text-align: center;
        font-variant-numeric: tabular-nums;
        line-height: 1.2;
        opacity: 0.9;
      }

      .voice-mobile-progress-container {
        display: none;
        width: 100%;
        height: 3px;
        background: var(--background-modifier-border);
        border-radius: var(--radius-xs);
        overflow: hidden;
        position: relative;
        margin-bottom: 4px;
      }

      .voice-mobile-progress-bar {
        height: 100%;
        width: 0%;
        background: var(--interactive-accent);
        border-radius: var(--radius-xs);
        transition: width 0.3s ease;
      }

      .voice-mobile-progress-container.visible {
        display: block;
      }

      .voice-mobile-progress-container.error {
        background: var(--color-red);
      }

      .voice-mobile-progress-container.error .voice-mobile-progress-bar {
        background: var(--text-error);
        width: 100% !important;
      }

      @media (max-width: 480px) {
        .voice-mobile-overlay {
          padding: 6px 8px;
          margin: 0 2px;
          border-radius: var(--radius-s) var(--radius-s) 0 0;
        }

        .voice-mobile-controls {
          gap: 4px;
        }

        .voice-mobile-control-btn {
          min-width: 32px;
          min-height: 32px;
          padding: 4px;
        }

        .voice-mobile-primary-btn {
          min-width: 38px;
          min-height: 38px;
        }

        .voice-mobile-speed-display {
          padding: 3px 6px;
          font-size: 10px;
          min-width: 32px;
        }

        .voice-mobile-speed-group {
          gap: 1px;
        }
      }

      .theme-dark .voice-mobile-overlay {
        box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.2), 0 -2px 8px rgba(0, 0, 0, 0.15);
      }

      @supports (bottom: env(safe-area-inset-bottom)) {
        .voice-mobile-overlay {
          bottom: max(80px, calc(env(safe-area-inset-bottom) + 60px));
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    const audio = this.ttsService.getAudio();
    audio.removeEventListener("play", () => this.onPlay());
    audio.removeEventListener("pause", () => this.onPause());
    audio.removeEventListener("ended", () => this.onEnded());
    audio.removeEventListener("canplaythrough", () => this.onCanPlayThrough());

    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
    }

    const styleEl = document.getElementById("voice-mobile-overlay-styles");
    if (styleEl) {
      styleEl.remove();
    }
  }
}
