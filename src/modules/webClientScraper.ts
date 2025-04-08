import { Github } from './github.js';
import { config } from '../core/config.js';
import { getAsset } from '../utils/downloadManager.js';
import { clearPath } from '../utils/fileManager.js';
import { existsSync, cpSync } from 'node:fs';
import { join } from 'node:path';

export class WebClientScraper {
    private git: Github;

    constructor() {
        this.git = new Github();
    }

    async start() {
        await this.downloadAssets();

        await this.initRepo();
        cpSync(`./${config.process_path}`, `./${config.github.output_repo}`, { recursive: true, force: true });
        await this.commitChanges()

        clearPath(`./${config.process_path}`);
    }

    async downloadAssets() {
        await getAsset('index.html', undefined, `./${config.process_path}`, 'html');
        await getAsset('sw.js', 'sw.js', `./${config.process_path}`, 'js');

        if (!['index.html', 'sw.js'].every(file => existsSync(join(`./${config.process_path}`, file)))) {
            process.exit();
        }
    }

    async initRepo() {        
        this.git.clone(`${config.github.repos_owner}/${config.github.output_repo}`);
    }

    async commitChanges() {
        if (config.deploy_on_github) {
            this.git.commit('🖥️ Web Update', config.github.output_repo);
        }
    }
}
