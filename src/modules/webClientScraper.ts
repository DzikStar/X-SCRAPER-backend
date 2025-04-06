import { Github } from './github.js';
import { config } from '../core/config.js';
import { getAsset } from '../utils/downloadManager.js';
import { clearPath } from '../utils/fileManager.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export class WebClientScraper {
    async start() {
        await this.downloadAssets();
        await this.manageRepository();
        clearPath('./X-SCRAPER-new');
    }

    async downloadAssets() {
        await getAsset('index.html', undefined, './X-SCRAPER-new', 'html');
        await getAsset('sw.js', 'sw.js', './X-SCRAPER-new', 'js');

        if (!['index.html', 'sw.js'].every(file => existsSync(join('./X-SCRAPER-new', file)))) {
            process.exit();
        }
    }

    async manageRepository() {
        const git = new Github();
        git.clone(config.github.output_repo);
        git.commit('🖥️ Web Update', 'X-SCRAPER');
    }
}
