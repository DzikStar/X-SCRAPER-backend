import { readFileSync } from 'node:fs';
import { join } from 'node:path';

class ConfigManager {
    private static instance: ConfigManager;
    public readonly config;

    private constructor() {
        this.config = JSON.parse(readFileSync(join(process.cwd(), 'xscraper.config.json'), 'utf8'));
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public getConfig() {
        return this.config;
    }
}

export const config = ConfigManager.getInstance().getConfig();
