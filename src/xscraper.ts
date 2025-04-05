import { Github } from './modules/github.js';

import { getAsset } from './utils/downloadManager.js';
import { loadConfig, clearPath } from './utils/fileManager.js';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default class Xscraper {
    async run() {
        const xscraperConfig = loadConfig();

        await getAsset('index.html', undefined, './X-SCRAPER-new', 'html');
        await getAsset('sw.js', 'sw.js', './X-SCRAPER-new', 'js');

        if (!['index.html', 'sw.js'].every(file => existsSync(join('./X-SCRAPER-new', file)))) {
            process.exit();
        }

        const git = new Github();

        git.clone(xscraperConfig['github']['output_repo']);
        git.commit("🖥️ Web Update", 'X-SCRAPER')

        clearPath('./X-SCRAPER-new');
    }
}
