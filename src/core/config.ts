import { promises as fs } from 'node:fs';
import { join } from 'node:path';

class ConfigManager {
    private static instance: ConfigManager;
    public config: any;

    private constructor() {
        this.loadConfig();
    }

    private async loadConfig() {
        try {
            const data = await fs.readFile(join(process.cwd(), 'xscraper.config.json'), 'utf8');
            this.config = JSON.parse(data);
        } catch (error) {
            console.error('Error parsing configuration file:', error);
            this.config = {};
        }
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

    public async reloadConfig() {
        await this.loadConfig();
    }
}

export const config = ConfigManager.getInstance().getConfig();
