import { Github } from './github.js';
import { ContentResolver } from './contentResolver.js';
import { config } from '../core/config.js';
import { getAsset } from '../utils/downloadManager.js';
import { clearPath } from '../utils/fileManager.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export class WebClientScraper {
    private git: Github;
    private resolver: ContentResolver;

    constructor() {
        this.git = new Github();
        this.resolver = new ContentResolver();
    }

    async start() {
        console.log('Starting WebClientScraper start method');
        try {
            do {
                console.info("    [X-SCRAPER] Started safe release download attempt.")
                await this.downloadCommonAssets('index1.html', 'sw1.js');
                await this.resolver.clearHTML('index1.html');

                await this.downloadCommonAssets('index2.html', 'sw2.js');
                await this.resolver.clearHTML('index2.html');
            } while (fs.open(`./${config.process_path}/index2.html`) != fs.open(`./${config.process_path}/index1.html`) || fs.open(`./${config.process_path}/sw2.js`) != fs.open(`./${config.process_path}/sw1.js`));

            fs.rm(`./${config.process_path}/index1.html`);
            fs.rm(`./${config.process_path}/sw1.html`);

            fs.rename(`./${config.process_path}/index2.html`, `./${config.process_path}/index.html`);
            fs.rename(`./${config.process_path}/sw2.html`, `./${config.process_path}/sw.html`);

            await this.downloadPlatformAssets();

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

    private async downloadCommonAssets(index: string, sw: string) {
        await getAsset(index, config.domain.twitter, `./${config.process_path}`, 'html');
        await getAsset(sw, `${config.domain.twitter}/sw.js`, `./${config.process_path}`, 'js');

        const filesExist = await Promise.all(
            [index, sw].map(async file => {
                try {
                    await fs.access(join(`./${config.process_path}`, file));
                    return true;
                } catch {
                    return false;
                }
            }),
        );

        if (!filesExist.every(exists => exists)) {
            process.exit();
        }
    }

    private async downloadPlatformAssets() {
        await this.resolver.getServiceWorkerScripts();
        await this.resolver.getInitScripts();
    }

    private async initRepo() {
        this.git.clone(`${config.github.repos_owner}/${config.github.output_repo}`);
    }

    private async commitChanges() {
        if (config.deploy_on_github) {
            this.git.commit(`🖥️ WEB Build: ${(await this.resolver.getSHA())?.slice(0, 7)}`, config.github.output_repo);
        }
    }
}
