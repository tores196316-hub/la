import fs from 'fs';
import path from 'path';
import { PricingSettings, DEFAULT_PRICING } from '../types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PRICING_FILE = path.join(DATA_DIR, 'pricing_settings.json');

class PricingConfigService {
  private currentSettings: PricingSettings = { ...DEFAULT_PRICING };

  constructor() {
    this.ensureDataDir();
    this.loadSettings();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('[PRICING_CONFIG] Failed to create data directory:', err);
      }
    }
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(PRICING_FILE)) {
        const raw = fs.readFileSync(PRICING_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.currentSettings = {
          ...DEFAULT_PRICING,
          ...parsed,
        };
        console.log('[PRICING_CONFIG] Pricing settings loaded from permanent storage:', this.currentSettings);
      }
    } catch (err: any) {
      console.warn('[PRICING_CONFIG] Could not load pricing settings from disk, using defaults:', err.message);
    }
  }

  public getSettings(): PricingSettings {
    return { ...this.currentSettings };
  }

  public updateSettings(partial: Partial<PricingSettings>): PricingSettings {
    this.currentSettings = {
      ...this.currentSettings,
      ...partial,
      updatedAt: Date.now(),
    };

    try {
      this.ensureDataDir();
      fs.writeFileSync(PRICING_FILE, JSON.stringify(this.currentSettings, null, 2), 'utf-8');
      console.log('[PRICING_CONFIG] Saved new pricing settings to disk:', this.currentSettings);
    } catch (err: any) {
      console.error('[PRICING_CONFIG] Failed to write pricing settings to disk:', err.message);
    }

    return { ...this.currentSettings };
  }
}

export const pricingConfigService = new PricingConfigService();
