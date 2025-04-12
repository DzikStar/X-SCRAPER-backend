import { Github } from './github.js';
import { ContentResolver } from './contentResolver.js';
import { config } from '../core/config.js';
import { getAsset } from '../utils/downloadManager.js';
import { clearPath } from '../utils/fileManager.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import logger from '../utils/logger.js';

export class WebClientScraper {
    private git: Github;
    private resolver: ContentResolver;

    constructor() {
        this.git = new Github();
        this.resolver = new ContentResolver();
    }

    async start(): Promise<void> {
        logger.debug('Initializing web client scraping process');

        try {
            logger.info('Downloading common assets');
            await this.downloadCommonAssets();

            await this.resolver.clearHTML();

            logger.info('Downloading platform-specific assets');
            await this.downloadPlatformAssets();

            logger.info('Preparing repository');
            await this.initRepo();

            const sourcePath = `./${config.process_path}`;
            const targetPath = `./${config.github.output_repo}`;

            logger.debug({ source: sourcePath, target: targetPath }, 'Copying processed files to output repository');
            await fs.cp(sourcePath, targetPath, { recursive: true, force: true });

            await this.commitChanges();

            logger.debug({ path: sourcePath }, 'Cleaning up temporary files');
            await clearPath(sourcePath);

            logger.info('Web client scraping completed successfully');
        } catch (error) {
            logger.error(
                {
                    err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
                'Web client scraping failed',
            );
            throw error;
        }
    }

    private async downloadCommonAssets() {
        await getAsset('index.html', config.domain.twitter, `./${config.process_path}`, 'html');
        await getAsset('sw.js', `${config.domain.twitter}/sw.js`, `./${config.process_path}`, 'js');

        const filesExist = await Promise.all(
            ['index.html', 'sw.js'].map(async file => {
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
