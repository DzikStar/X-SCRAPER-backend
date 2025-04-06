import { Github } from './github.js';
import { getAsset } from '../utils/downloadManager.js';
import { loadConfig, clearPath } from '../utils/fileManager.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export class WebClientScraper {
    private config: { github: { output_repo: string } };

    constructor() {
        this.config = loadConfig();
    }

    async start() {
        await this.downloadAssets();
        await this.manageRepository(this.config);
        clearPath('./X-SCRAPER-new');
    }

    async downloadAssets() {
        await getAsset('index.html', undefined, './X-SCRAPER-new', 'html');
        await getAsset('sw.js', 'sw.js', './X-SCRAPER-new', 'js');

        if (!['index.html', 'sw.js'].every(file => existsSync(join('./X-SCRAPER-new', file)))) {
            process.exit();
        }
    }

    async manageRepository(config: { github: { output_repo: string } }) {
        const git = new Github();
        git.clone(config.github.output_repo);
        git.commit('🖥️ Web Update', 'X-SCRAPER');
    }
}
