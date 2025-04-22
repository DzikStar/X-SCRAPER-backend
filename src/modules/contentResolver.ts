import * as cheerio from 'cheerio';
import * as prettier from 'prettier';
import { promises as fs } from 'node:fs';
import { saveFile } from '../utils/fileManager.js';
import { getAsset } from '../utils/downloadManager.js';
import { config } from '../core/config.js';
import logger from '../utils/logger.js';

export class ContentResolver {
    async clearHTML(indexName: string): Promise<void> {
        logger.debug({ filename: indexName }, 'Cleaning HTML file from non-static content');

        let nonceCleared = 0,
            verifCardCleaned = false,
            removedReactStyles = false;

        try {
            const indexPath = `${config.process_path}/${indexName}`;
            logger.debug({ path: indexPath, file: indexName }, 'Reading Index file');
            const indexHTML = await fs.readFile(indexPath, 'utf-8');
            const $ = cheerio.load(indexHTML);

            // Remove nonce attributes
            $('[nonce]').each((i, element) => {
                $(element).attr('nonce', 'REPLACED_BY_X-SCRAPER');
                nonceCleared++;
            });

            // Clean verification tags
            $('meta[name="twitter-site-verification"]').each((i, element) => {
                $(element).attr('content', 'REPLACED_BY_X-SCRAPER');
                verifCardCleaned = true;
            });

            // Clean React native stylesheet
            $('style#react-native-stylesheet').each((i, element) => {
                const originalContent = $(element).html();

                if (originalContent) {
                    const cleaned = originalContent.replace(/^\s*\.r-vlxjld\b[^{]*\{[^}]*\}\s*$\n?/gm, '').replace(/^\s*\.r-yfoy6g\b[^{]*\{[^}]*\}\s*$\n?/gm, '');

                    $(element).html(cleaned);
                    removedReactStyles = true;
                }
            });

            logger.info(
                {
                    nonceCleared,
                    verifCardCleaned,
                    removedReactStyles,
                },
                'HTML cleaning statistics',
            );

            let content = await prettier.format($.html(), {
                parser: 'html',
                tabWidth: 4,
                useTabs: false,
                printWidth: 2000,
            });

            logger.debug('Anonymizing sensitive identifiers in HTML');
            content = content.replace(RegExp('gt=...................'), 'gt=0000000000000000000');
            content = content.replace(RegExp('guestId: ".................."'), 'guestId: "000000000000000000"');
            content = content.replace(RegExp('serverDate: .............,'), 'serverDate: 0000000000000,');
            content = content.replace(RegExp('userHash: "................................................................"'), 'userHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');

            await saveFile(indexName, content, config.process_path);
            logger.debug({ filename: indexName }, 'HTML successfully cleaned and saved');
        } catch (error) {
            logger.error(
                {
                    err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
                'Failed to clean HTML',
            );
            throw error;
        }
    }

    async getServiceWorkerScripts(): Promise<void> {
        logger.info('Processing service worker scripts');

        try {
            const swPath = `${config.process_path}/sw.js`;
            logger.debug({ path: swPath }, 'Reading service worker file');

            const swFile = await fs.readFile(swPath, 'utf-8');
            const swURL = swFile.match(/importScripts\s*\(\s*(['"])(.*?)\1/);

            if (swURL && swURL[2]) {
                const scriptUrl = swURL[2];
                logger.info({ scriptUrl }, 'Service worker script detected');

                const filename = this.getFilename(scriptUrl);
                const path = this.getPath(scriptUrl);

                logger.debug({ scriptUrl, filename, path }, 'Downloading service worker script');
                await getAsset(filename, scriptUrl, path, 'js');
            } else {
                logger.warn('No service worker scripts found in SW file');
            }
        } catch (error) {
            logger.error(
                {
                    err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
                'Failed to process service worker scripts',
            );
            throw error;
        }
    }

    async getInitScripts(): Promise<void> {
        logger.info('Processing initialization scripts from HTML');

        try {
            const indexPath = `${config.process_path}/index.html`;
            logger.debug({ path: indexPath }, 'Reading index.html file');

            const indexHTML = await fs.readFile(indexPath, 'utf-8');
            const $ = cheerio.load(indexHTML);

            const elements = $('link[rel="preload"]').get();
            logger.info({ scriptCount: elements.length }, 'Found preloaded scripts to download');

            let downloadedCount = 0;

            for (const element of elements) {
                const assetUrl = $(element).attr('href');
                if (assetUrl) {
                    const filename = this.getFilename(assetUrl);
                    const path = this.getPath(assetUrl);

                    logger.debug({ assetUrl, filename, path }, 'Downloading initialization script');
                    await getAsset(filename, assetUrl, path, 'js');
                    downloadedCount++;
                }
            }

            logger.info({ downloadedCount }, 'Successfully downloaded initialization scripts');
        } catch (error) {
            logger.error(
                {
                    err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
                'Failed to download initialization scripts',
            );
            throw error;
        }
    }

    async getSHA(path: string): Promise<string | undefined> {
        logger.info('Extracting release SHA from sw.js');

        try {
            const swPath = `${path}/sw.js`;
            logger.debug({ path: swPath }, 'Reading sw.js file');

            const swFile = await fs.readFile(swPath, 'utf-8');
            const SHA = swFile.match(/sha:\s*"([a-f0-9]{40})"/);

            if (SHA && SHA[1]) {
                const shaValue = SHA[1];
                logger.info({ sha: shaValue }, 'Release SHA extracted successfully');
                return shaValue;
            } else {
                logger.warn('No SHA hash found in sw.js file');
                return undefined;
            }
        } catch (error) {
            logger.error(
                {
                    err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
                'Failed to extract SHA from service worker',
            );
            return undefined;
        }
    }

    async getAssetsFromSW(): Promise<string[] | undefined> {
        logger.debug('Starting extraction of static URLs from sw.js');
        try {
            const swFilePath = `./${config.process_path}/sw.js`;
            logger.debug({ filePath: swFilePath }, 'Reading service worker file');
            const swContent = await fs.readFile(swFilePath, 'utf-8');
            logger.debug({ contentLength: swContent.length }, 'Service worker file read successfully');

            const swMatch = swContent.match(/self\.ASSETS\s*=\s*\[([\s\S]*?)\];/);
            if (!swMatch) {
                logger.warn({ file: swFilePath }, 'No matching ASSETS array found in sw.js');
                throw new Error("Couldn't match content in sw.js");
            }
            logger.debug('ASSETS array matched in sw.js');

            // Replace apostrophes with quotation marks and trim trailing commas
            const swTableContent = swMatch[1]
                .replace(/'/g, '"')
                .replace(/,\s*(\]|$)/g, '$1')
                .trim();
            logger.debug({ swTableLength: swTableContent.length }, 'Processed ASSETS content');

            try {
                const parsedAssets: string[] = JSON.parse(`[${swTableContent}]`);
                return parsedAssets;
            } catch (parseError) {
                logger.error({ err: parseError }, 'Failed to parse ASSETS table JSON');
                throw parseError;
            }
        } catch (error) {
            logger.error({ err: error }, 'Extracting static URLs from sw.js failed');
            throw error;
        }
    }

    getAssetsFromIndex(): string[] {
        logger.debug('Extracting static URLs from sw.js');
        return ['TODO'];
    }

    getPath(url: string): string {
        if (!url.startsWith(`${config.domain.abs_twimg}/responsive-web`)) {
            return url;
        }

        const replacedPath = url.replace(`${config.domain.abs_twimg}/responsive-web`, `./${config.process_path}`);
        const pathSegments = replacedPath.split('/');

        pathSegments.pop();

        return pathSegments.join('/');
    }

    fixPath(filename: string): string {
        const lastDot = filename.lastIndexOf('.');

        filename = filename.replace('~~', '/');
        filename = filename.replace('~', '/');

        if (lastDot !== -1) {
            filename = filename.substring(0, lastDot).replace(/\./g, '/') + filename.substring(lastDot);
        } else {
            filename = filename.replace(/\./g, '/');
        }

        return filename;
    }

    getFilename(url: string): string {
        const filenameWithSHA = url.substring(url.lastIndexOf('/') + 1);
        return filenameWithSHA.replace(/^(.*)\.[a-f0-9]{8}(\.[^.]+)$/, '$1$2');
    }
}
