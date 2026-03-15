import { DEFAULT_SETTINGS, VoiceSettings } from "../settings/VoiceSettings";
import { VoiceSettingTab } from "../settings/VoiceSettingTab";
import { HotkeySettings } from "../settings/HotkeySettings";
import { AwsPollyService } from "../service/AwsPollyService";
import { GoogleTTSService } from "../service/GoogleTTSService";
import { TTSService } from "../service/TTSService";
import { Plugin, Platform } from "obsidian";
import { MarkdownHelper } from "./MarkdownHelper";
import { IconEventHandler } from "./IconEventHandler";
import { TextSpeaker } from "./TextSpeaker";

export class Voice extends Plugin {
  settings: VoiceSettings;
  private markdownHelper: MarkdownHelper;
  private ttsService: TTSService;
  private hotkeySettings: HotkeySettings;
  public iconEventHandler: IconEventHandler;
  private textSpeaker: TextSpeaker;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VoiceSettingTab(this.app, this));
    this.markdownHelper = new MarkdownHelper(this.app);

    this.ttsService = this.createTTSService();

    this.iconEventHandler = new IconEventHandler(this, this, this.ttsService);
    this.textSpeaker = new TextSpeaker(
      this.ttsService,
      this.markdownHelper,
      this.iconEventHandler,
      this.settings.spellOutAcronyms,
    );

    this.hotkeySettings = new HotkeySettings(this, this.ttsService);
    this.hotkeySettings.initHotkeys();
  }

  private createTTSService(): TTSService {
    if (this.settings.TTS_PROVIDER === "google") {
      return new GoogleTTSService(
        this.settings.GOOGLE_API_KEY,
        this.settings.VOICE,
        Number(this.settings.SPEED),
      );
    }

    return new AwsPollyService(
      {
        credentials: {
          accessKeyId: String(this.settings.AWS_ACCESS_KEY_ID),
          secretAccessKey: String(this.settings.AWS_SECRET_ACCESS_KEY),
        },
        region: String(this.settings.AWS_REGION),
      },
      this.settings.VOICE,
      Number(this.settings.SPEED),
    );
  }

  async speakText(speed?: number) {
    await this.textSpeaker.speakText(speed);
  }

  isMobile(): boolean {
    return Platform.isMobile;
  }

  onunload() {
    if (this.iconEventHandler) {
      this.iconEventHandler.removeEventListeners();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  public reinitializePollyService(): void {
    if (this.settings.TTS_PROVIDER === "aws") {
      const awsService = this.ttsService as AwsPollyService;
      if (
        this.settings.AWS_ACCESS_KEY_ID &&
        this.settings.AWS_SECRET_ACCESS_KEY &&
        this.settings.AWS_REGION
      ) {
        awsService.updateCredentials({
          credentials: {
            accessKeyId: String(this.settings.AWS_ACCESS_KEY_ID),
            secretAccessKey: String(this.settings.AWS_SECRET_ACCESS_KEY),
          },
          region: String(this.settings.AWS_REGION),
        });
      }
    }
  }

  public reinitializeTTSService(): void {
    this.ttsService = this.createTTSService();

    this.iconEventHandler.updateService(this.ttsService);

    this.textSpeaker = new TextSpeaker(
      this.ttsService,
      this.markdownHelper,
      this.iconEventHandler,
      this.settings.spellOutAcronyms,
    );

    this.hotkeySettings = new HotkeySettings(this, this.ttsService);
  }

  public reinitializeTextSpeaker(): void {
    this.textSpeaker = new TextSpeaker(
      this.ttsService,
      this.markdownHelper,
      this.iconEventHandler,
      this.settings.spellOutAcronyms,
    );
  }

  public getTTSService(): TTSService {
    return this.ttsService;
  }

  /** @deprecated Use getTTSService() instead */
  public getPollyService(): TTSService {
    return this.ttsService;
  }
}
