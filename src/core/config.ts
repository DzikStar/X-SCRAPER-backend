import { readFile, readFileSync } from 'node:fs/promises';
import { join } from 'node:path';

interface Config {
    process_path: string;
    deploy_on_github: boolean;
    github: {
        repos_owner: string;
        input_repo: string;
        output_repo: string;
        writer_username: string;
        writer_usermail: string;
    };
}

class ConfigManager {
    private static instance: ConfigManager;
    public readonly config: Config;

    private constructor(config: Config) {
        this.config = config;
    }

    public static async getInstance(): Promise<ConfigManager> {
        if (!ConfigManager.instance) {
            const configFile = await readFile(join(process.cwd(), 'xscraper.config.json'), 'utf8');
            const config = JSON.parse(configFile) as Config;
            ConfigManager.instance = new ConfigManager(config);
        }
        return ConfigManager.instance;
    }

    public getConfig(): Config {
        return this.config;
    }
}

export const config = await ConfigManager.getInstance().then(manager => manager.getConfig());
