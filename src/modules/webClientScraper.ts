import { Github } from '../services/github.js';
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
            let safemodeRetries: number = 1;
            let areIndexesSame, areSwSame;

            do {
                logger.debug({ attemp: safemodeRetries, sample: 1 }, 'Downloading common assets');
                await this.downloadCommonAssets('index1.html', 'sw1.js');
                await this.resolver.clearHTML('index1.html');

                logger.debug({ attemp: safemodeRetries, sample: 2 }, 'Downloading common assets');
                await this.downloadCommonAssets('index2.html', 'sw2.js');
                await this.resolver.clearHTML('index2.html');

                areIndexesSame = await this.areFilesEqual(`./${config.process_path}/index1.html`, `./${config.process_path}/index2.html`);
                areSwSame = await this.areFilesEqual(`./${config.process_path}/sw1.js`, `./${config.process_path}/sw2.js`);

                if (!areIndexesSame || !areSwSame) {
                    logger.info(
                        {
                            attempt: safemodeRetries,
                            areIndexesSame: areIndexesSame,
                            areSwSame: areSwSame,
                        },
                        'Mismatch in downloaded assets. Retrying download process.',
                    );
                }

                safemodeRetries++;
            } while (!areIndexesSame || !areSwSame);

            await fs.rm(`./${config.process_path}/index1.html`);
            await fs.rm(`./${config.process_path}/sw1.js`);
            logger.info('Successfully removed the first sample');

            await fs.rename(`./${config.process_path}/index2.html`, `./${config.process_path}/index.html`);
            await fs.rename(`./${config.process_path}/sw2.js`, `./${config.process_path}/sw.js`);
            logger.info('Successfully renamed second sample to main files');

            logger.info('Preparing repository');
            await this.initRepo();

            const indexNoChanges = await this.areFilesEqual(`./${config.process_path}/index.html`, `./${config.github.output_repo}/index.html`);
            const swNoChanges = await this.areFilesEqual(`./${config.process_path}/sw.js`, `./${config.github.output_repo}/sw.js`);

            logger.debug(
                {
                    indexNoChanges: indexNoChanges,
                    swNoChanges: swNoChanges,
                },
                'Completed detecting changes in index.html and sw.js',
            );

            if (config.exit_if_no_differences === true && indexNoChanges && swNoChanges) {
                if (process.env.CONFIG_OVERRIDE__EXIT_IF_NO_DIFFERENCES === 'false') {
                    logger.debug('Scrap Forced - continuing despite no changes');
                } else {
                    logger.debug('No changes found.');
                    return;
                }
            }

            //------------------------------[REMOVE LATER - TEMPORARY]------------------------------
            const targetDir = `./${config.github.output_repo}`;

            logger.debug({ target: targetDir }, 'Clearing repository path');
            const repoFolder = await fs.readdir(targetDir, { withFileTypes: true });
            for (const item of repoFolder) {
                if (item.name !== '.git') {
                    await fs.rm(join(targetDir, item.name), { recursive: true, force: true });
                }
            }
            //-------------------------------------------------------------------------------------

            logger.debug('Downloading preload static assets');
            await this.downloadPreloadAssets();

            logger.debug('Donwloading static assets');
            await this.downloadStaticAssets();

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

    private async downloadPreloadAssets() {
        await this.resolver.getServiceWorkerScripts();
        await this.resolver.getInitScripts();
    }

    private async downloadStaticAssets(): Promise<void> {
        const swAssets = await this.resolver.getAssetsFromSW();
        const indexAssets = await this.resolver.getAssetsFromIndex();

        const allAssets = [...new Set([...(swAssets ?? []), ...(indexAssets ?? [])])];
        logger.info(
            {
                sw: swAssets?.length,
                index: indexAssets?.length,
                total: allAssets.length,
            },
            'Found static assets',
        );

        for (const asset of allAssets) {
            let filename = this.resolver.getFilename(asset);
            const path = this.resolver.getPath(asset);

            filename = this.resolver.fixPath(filename);

            logger.debug({ asset, filename, path }, 'Downloading static script');
            await getAsset(filename, asset, path, 'js');
        }
    }

    private async initRepo() {
        this.git.clone(`${config.github.repos_owner}/${config.github.output_repo}`);
    }

    private async commitChanges() {
        if (config.deploy_on_github) {
            this.git.commit(`🖥️ WEB Build: ${(await this.resolver.getSHA(config.process_path))?.slice(0, 7)}`, config.github.output_repo);
        }
    }

    private async areFilesEqual(file1: string, file2: string): Promise<boolean> {
        const content1 = await fs.readFile(file1, 'utf8');
        const content2 = await fs.readFile(file2, 'utf8');
        return content1 === content2;
    }
}
