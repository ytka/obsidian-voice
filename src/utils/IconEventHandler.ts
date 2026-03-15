import { Plugin, setIcon, Notice, Menu } from "obsidian";
import { Voice } from "./VoicePlugin";
import { TTSService } from "../service/TTSService";
import { MobileControlBar } from "./MobileControlBar";
import { AudioFileManager } from "./AudioFileManager";
import { getVoicesForProvider } from "../settings/VoiceSettings";

export class IconEventHandler {
  private ttsService: TTSService;
  private plugin: Plugin;
  private voice: Voice;
  private statusBarItem: HTMLElement;
  private voiceDisplayEl: HTMLElement;
  private ribbonIconEl: HTMLElement;
  private playPauseIconEl: HTMLElement;
  private downloadIconEl: HTMLElement;
  private speedDisplayEl: HTMLElement;
  private progressBarContainer: HTMLElement;
  private progressBar: HTMLElement;
  private isErrorState: boolean = false;
  private mobileControlBar?: MobileControlBar;
  private audioFileManager: AudioFileManager;
  private onPlayListener = () => this.onPlay();
  private onPauseListener = () => this.onPause();
  private onCanPlayThroughListener = () => this.onCanPlayThrough();

  constructor(plugin: Plugin, voice: Voice, ttsService: TTSService) {
    this.plugin = plugin;
    this.voice = voice;
    this.ttsService = ttsService;
    this.audioFileManager = new AudioFileManager(plugin.app);

    this.addSpeedControlStyles();
    this.addProgressBarStyles();
    this.initStatusBarItem();
    this.initRibbonIcon();

    // Initialize mobile control bar if on mobile
    if (this.voice.isMobile()) {
      this.mobileControlBar = new MobileControlBar(
        this.plugin.app,
        this.voice,
        this.ttsService,
      );
    }

    // Set up progress callback for TTS loading
    this.ttsService.setProgressCallback((progress: number) => {
      this.updateProgressBar(progress);
      if (this.mobileControlBar) {
        this.mobileControlBar.updateProgressFromExternal(progress);
      }
    });

    // Set up error callback for TTS errors
    this.ttsService.setErrorCallback((error: string) => {
      this.handleError(error);
      if (this.mobileControlBar) {
        this.mobileControlBar.handleErrorFromExternal();
      }
    });

    // Listen for file changes to update download button visibility
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => {
        this.updateDownloadButtonVisibility();
      }),
    );
  }

  public updateService(ttsService: TTSService): void {
    // Remove old event listeners
    const oldAudio = this.ttsService.getAudio();
    oldAudio.removeEventListener("play", this.onPlayListener);
    oldAudio.removeEventListener("pause", this.onPauseListener);
    oldAudio.removeEventListener("canplaythrough", this.onCanPlayThroughListener);

    this.ttsService = ttsService;

    // Set up callbacks on new service
    this.ttsService.setProgressCallback((progress: number) => {
      this.updateProgressBar(progress);
      if (this.mobileControlBar) {
        this.mobileControlBar.updateProgressFromExternal(progress);
      }
    });

    this.ttsService.setErrorCallback((error: string) => {
      this.handleError(error);
      if (this.mobileControlBar) {
        this.mobileControlBar.handleErrorFromExternal();
      }
    });

    // Attach new event listeners
    this.initializeEventListeners();

    // Update mobile control bar if present
    if (this.mobileControlBar) {
      this.mobileControlBar.updateService(this.ttsService);
    }
  }

  private createVoiceSwitcher(): void {
    this.voiceDisplayEl = this.statusBarItem.createEl("span", {
      cls: "voice-statusbar-voice-switcher",
    });
    this.voiceDisplayEl.style.marginRight = "10px";
    this.voiceDisplayEl.style.cursor = "pointer";
    this.voiceDisplayEl.style.fontWeight = "bold";
    this.voiceDisplayEl.style.fontSize = "0.9em";
    this.voiceDisplayEl.setAttribute("aria-label", "Change Voice");
    this.voiceDisplayEl.setAttribute("aria-label-position", "top");

    this.updateVoiceDisplay();

    this.voiceDisplayEl.addEventListener("click", (event) => {
      const menu = new Menu();
      const voices = getVoicesForProvider(this.voice.settings.TTS_PROVIDER);

      voices.forEach((voice) => {
        menu.addItem((item) =>
          item
            .setTitle(voice.label)
            .setChecked(voice.id === this.ttsService.getVoice())
            .onClick(async () => {
              this.voice.settings.VOICE = voice.id;
              await this.voice.saveSettings();
              this.ttsService.setVoice(voice.id);
              this.updateVoiceDisplay();
            }),
        );
      });

      menu.showAtMouseEvent(event);
    });
  }

  public updateVoiceDisplay(): void {
    if (this.voiceDisplayEl) {
      this.voiceDisplayEl.setText(this.ttsService.getVoice() || "Stephen");
    }
  }

  private initStatusBarItem(): void {
    this.statusBarItem = this.plugin.addStatusBarItem();

    this.addVoiceControlsSeparator();
    this.createVoiceSwitcher();
    this.createProgressBar();

    // Rewind
    this.createStatusBarIcon(
      "rewind",
      "rewind",
      () => this.ttsService.rewindAudio(),
      false,
      "Rewind 3 seconds",
    );

    // Stop
    this.createStatusBarIcon(
      "square",
      "stop",
      () => {
        if (this.ttsService.isOperationInProgress()) {
          this.ttsService.cancelOperation();
          this.resetIconsToPlayState();
          this.hideProgressBar();
          return;
        }
        this.ttsService.stopAudio();
      },
      false,
      "Stop audio",
    );

    this.addSpeedControls();

    // Play/Pause
    this.playPauseIconEl = this.createStatusBarIcon(
      "play",
      "play",
      () => {
        if (this.ttsService.isOperationInProgress()) {
          this.ttsService.cancelOperation();
          this.resetIconsToPlayState();
          this.hideProgressBar();
          return;
        }

        if (!this.ttsService.isPlaying()) {
          this.playPauseIconEl.addClass("rotating-icon");
          setIcon(this.playPauseIconEl, "refresh-ccw");
        }
        this.voice.speakText();
      },
      true,
      "Play / Pause",
    );

    // Fast-forward
    this.createStatusBarIcon(
      "fast-forward",
      "fast-forward",
      () => this.ttsService.fastForwardAudio(),
      false,
      "Fast-forward 3 seconds",
    );

    // Download MP3
    this.downloadIconEl = this.createStatusBarIcon(
      "download",
      "download-audio",
      () => this.handleDownloadAudio(),
      false,
      "Download audio as MP3",
    );
    this.downloadIconEl.style.display = "none";

    this.addVoiceControlsSeparator();

    setTimeout(() => {
      this.updateSpeedDisplay();
    }, 100);
  }

  private createStatusBarIcon(
    icon: string,
    cls: string,
    onClick: () => void,
    isPlayPauseIcon: boolean = false,
    tooltip?: string,
  ): HTMLElement {
    const iconEl = this.statusBarItem.createEl("span", {
      cls: "status-bar-icon " + cls,
    });
    iconEl.style.marginRight = "5px";
    setIcon(iconEl, icon);
    iconEl.addEventListener("click", onClick);

    if (tooltip) {
      iconEl.title = tooltip;
    }

    if (isPlayPauseIcon) {
      this.playPauseIconEl = iconEl;
    }

    return iconEl;
  }

  private initRibbonIcon(): void {
    this.ribbonIconEl = this.plugin.addRibbonIcon(
      "play-circle",
      "Voice read text",
      () => {
        if (this.ttsService.isOperationInProgress()) {
          this.ttsService.cancelOperation();
          this.resetIconsToPlayState();
          this.hideProgressBar();
          if (this.mobileControlBar) {
            this.mobileControlBar.hide();
          }
          return;
        }

        if (!this.ttsService.isPlaying()) {
          this.ribbonIconHandler();
        }
        this.voice.speakText();
      },
    );
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    const audio = this.ttsService.getAudio();
    audio.addEventListener("play", this.onPlayListener);
    audio.addEventListener("pause", this.onPauseListener);
    audio.addEventListener("canplaythrough", this.onCanPlayThroughListener);
  }

  public removeEventListeners(): void {
    const audio = this.ttsService.getAudio();
    audio.removeEventListener("play", this.onPlayListener);
    audio.removeEventListener("pause", this.onPauseListener);
    audio.removeEventListener("canplaythrough", this.onCanPlayThroughListener);

    if (this.mobileControlBar) {
      this.mobileControlBar.destroy();
      this.mobileControlBar = undefined;
    }
  }

  public updateSpeedDisplayFromSettings(): void {
    this.updateSpeedDisplay();
  }

  ribbonIconHandler() {
    if (!this.ribbonIconEl) {
      console.error("Ribbon icon element is not initialized.");
      return;
    }

    if (!this.ttsService.isPlaying()) {
      this.isErrorState = false;

      this.ribbonIconEl.addClass("rotating-icon");
      this.playPauseIconEl.addClass("rotating-icon");
      setIcon(this.ribbonIconEl, "refresh-ccw");
      setIcon(this.playPauseIconEl, "refresh-ccw");

      if (this.mobileControlBar) {
        this.mobileControlBar.showLoadingStateFromExternal();
      } else {
        this.showProgressBar();
        this.updateProgressBar(0);
      }
    }
  }

  private onPlay(): void {
    if (this.ribbonIconEl) {
      this.ribbonIconEl.removeClass("rotating-icon");
      setIcon(this.ribbonIconEl, "pause-circle");
    }
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "pause");
    }
    this.hideProgressBar();
    this.showDownloadButton();
  }

  private onPause(): void {
    if (this.ribbonIconEl) {
      this.ribbonIconEl.removeClass("rotating-icon");
      setIcon(this.ribbonIconEl, "play-circle");
    }
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "play");
    }
    this.hideProgressBar();
  }

  private addSpeedControls(): void {
    this.createStatusBarIcon(
      "minus",
      "speed-decrease",
      () => this.decreaseSpeed(),
      false,
      "Decrease speed",
    );

    this.speedDisplayEl = this.statusBarItem.createEl("span", {
      cls: "status-bar-speed-display",
    });
    this.speedDisplayEl.style.marginLeft = "4px";
    this.speedDisplayEl.style.marginRight = "4px";
    this.speedDisplayEl.style.minWidth = "30px";
    this.speedDisplayEl.style.textAlign = "center";
    this.speedDisplayEl.style.fontSize = "11px";
    this.speedDisplayEl.style.fontWeight = "500";
    this.speedDisplayEl.style.color = "var(--text-normal)";
    this.updateSpeedDisplay();

    this.createStatusBarIcon(
      "plus",
      "speed-increase",
      () => this.increaseSpeed(),
      false,
      "Increase speed",
    );
  }

  private updateSpeedDisplay(): void {
    if (this.speedDisplayEl) {
      const currentSpeed = this.ttsService.getSpeed();
      this.speedDisplayEl.textContent = `${currentSpeed.toFixed(1)}x`;
      this.speedDisplayEl.title = `Current playback speed: ${currentSpeed.toFixed(1)}x`;
    }
  }

  private decreaseSpeed(): void {
    const currentSpeed = this.ttsService.getSpeed();
    const newSpeed = Math.max(0.5, Math.round((currentSpeed - 0.1) * 10) / 10);

    if (newSpeed !== currentSpeed) {
      this.ttsService.setSpeed(newSpeed);
      this.voice.settings.SPEED = newSpeed;
      this.voice.saveSettings();
      this.updateSpeedDisplay();
    }
  }

  private increaseSpeed(): void {
    const currentSpeed = this.ttsService.getSpeed();
    const newSpeed = Math.min(1.9, Math.round((currentSpeed + 0.1) * 10) / 10);

    if (newSpeed !== currentSpeed) {
      this.ttsService.setSpeed(newSpeed);
      this.voice.settings.SPEED = newSpeed;
      this.voice.saveSettings();
      this.updateSpeedDisplay();
    }
  }

  private addVoiceControlsSeparator(): void {
    const separator = this.statusBarItem.createEl("span", {
      cls: "status-bar-separator",
    });
    separator.style.marginLeft = "8px";
    separator.style.marginRight = "8px";
    separator.style.color = "var(--text-muted)";
    separator.textContent = "|";
  }

  private addSpeedControlStyles(): void {
    if (document.getElementById("voice-speed-control-styles")) return;

    const style = document.createElement("style");
    style.id = "voice-speed-control-styles";
    style.textContent = `
      .status-bar-speed-display {
        background: var(--background-modifier-hover);
        border-radius: 3px;
        padding: 2px 6px;
        font-variant-numeric: tabular-nums;
        transition: background-color 0.2s ease;
      }

      .status-bar-speed-display:hover {
        background: var(--background-modifier-active-hover);
      }

      .status-bar-icon.speed-decrease,
      .status-bar-icon.speed-increase {
        opacity: 0.8;
        transition: opacity 0.2s ease, transform 0.1s ease;
      }

      .status-bar-icon.speed-decrease:hover,
      .status-bar-icon.speed-increase:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .status-bar-icon.speed-decrease:active,
      .status-bar-icon.speed-increase:active {
        transform: scale(0.95);
      }

      .status-bar-separator {
        opacity: 0.3;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  private addProgressBarStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .voice-progress-bar-container {
        display: none;
        width: 100px;
        height: 4px;
        background: var(--background-modifier-border);
        border-radius: 2px;
        margin: 0 8px;
        overflow: hidden;
        position: relative;
        align-self: center;
      }

      .voice-progress-bar {
        height: 100%;
        width: 0%;
        background: var(--interactive-accent);
        border-radius: 2px;
        transition: width 0.3s ease, background-color 0.3s ease;
      }

      .voice-progress-bar-container.visible {
        display: block;
      }

      .voice-progress-bar-container.error {
        background: var(--background-modifier-error);
      }

      .voice-progress-bar-container.error .voice-progress-bar {
        background: var(--text-error);
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
  }

  private createProgressBar(): void {
    this.progressBarContainer = this.statusBarItem.createEl("div", {
      cls: "voice-progress-bar-container",
    });

    this.progressBar = this.progressBarContainer.createEl("div", {
      cls: "voice-progress-bar",
    });

    this.hideProgressBar();
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

  private handleError(errorMessage: string): void {
    this.showErrorState();
    this.resetIconsToPlayState();
    new Notice(`🔊 Voice Plugin: ${errorMessage}`, 5000);

    setTimeout(() => {
      this.hideProgressBar();
    }, 3000);
  }

  private resetIconsToPlayState(): void {
    if (this.ribbonIconEl) {
      this.ribbonIconEl.removeClass("rotating-icon");
      setIcon(this.ribbonIconEl, "play-circle");
    }
    if (this.playPauseIconEl) {
      this.playPauseIconEl.removeClass("rotating-icon");
      setIcon(this.playPauseIconEl, "play");
    }
  }

  private onCanPlayThrough(): void {
    this.hideProgressBar();
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

  private updateDownloadButtonVisibility(): void {
    const activeFile = this.plugin.app.workspace.getActiveFile();
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
      const activeFile = this.plugin.app.workspace.getActiveFile();
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
}
