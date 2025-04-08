import { Github } from './github.js';
import { config } from '../core/config.js';
import { getAsset } from '../utils/downloadManager.js';
import { clearPath } from '../utils/fileManager.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export class WebClientScraper {
    private git: Github;

    constructor() {
        this.git = new Github();
    }

    async start() {
        console.log('Starting WebClientScraper start method');
        try {
            await this.downloadAssets();

            await this.initRepo();
            await fs.cp(`./${config.process_path}`, `./${config.github.output_repo}`, { recursive: true, force: true });
            await this.commitChanges();

            await clearPath(`./${config.process_path}`);
        } catch (error) {
            console.error('Error in WebClientScraper start method:', error);
        } finally {
            console.log('Ending WebClientScraper start method');
        }
    }

    async downloadAssets() {
        await getAsset('index.html', undefined, `./${config.process_path}`, 'html');
        await getAsset('sw.js', 'sw.js', `./${config.process_path}`, 'js');

        const filesExist = await Promise.all(
            ['index.html', 'sw.js'].map(async file => {
                try {
                    await fs.access(join(`./${config.process_path}`, file));
                    return true;
                } catch {
                    return false;
                }
            })
        );

        if (!filesExist.every(exists => exists)) {
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
