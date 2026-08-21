import fs from 'fs';
import path from 'path';
import { SpeedSettings, DEFAULT_SPEED_SETTINGS } from '../types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'speed_settings.json');
const LEGACY_SETTINGS_FILE = path.resolve(process.cwd(), 'tmp', 'speed_settings.json');

class SpeedConfigService {
  private currentSettings: SpeedSettings = { ...DEFAULT_SPEED_SETTINGS };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.currentSettings = {
          ...DEFAULT_SPEED_SETTINGS,
          ...parsed,
        };
        console.log('[SPEED_CONFIG] Speed settings loaded from permanent storage:', this.currentSettings);
      } else if (fs.existsSync(LEGACY_SETTINGS_FILE)) {
        const raw = fs.readFileSync(LEGACY_SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.currentSettings = {
          ...DEFAULT_SPEED_SETTINGS,
          ...parsed,
        };
        // Save to new permanent location
        this.updateSettings(this.currentSettings);
        console.log('[SPEED_CONFIG] Migrated speed settings from legacy location.');
      }
    } catch (err: any) {
      console.warn('[SPEED_CONFIG] Could not load speed settings from disk, using defaults:', err.message);
    }
  }

  public getSettings(): SpeedSettings {
    return { ...this.currentSettings };
  }

  public updateSettings(newSettings: Partial<SpeedSettings>): SpeedSettings {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
      updatedAt: Date.now(),
    };

    try {
      const dir = path.dirname(SETTINGS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.currentSettings, null, 2), 'utf-8');
      console.log('[SPEED_CONFIG] Updated speed settings saved to disk:', this.currentSettings);
    } catch (err: any) {
      console.error('[SPEED_CONFIG] Error saving speed settings to disk:', err);
    }

    return { ...this.currentSettings };
  }
}

export const speedConfigService = new SpeedConfigService();
