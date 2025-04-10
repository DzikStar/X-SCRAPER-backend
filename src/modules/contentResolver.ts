import * as cheerio from 'cheerio';
import * as prettier from 'prettier';
import { promises as fs } from 'node:fs';
import { saveFile } from '../utils/fileManager.js';
import { getAsset } from 'utils/downloadManager.js';
import { config } from '../core/config.js';

export class ContentResolver {
    async clearHTML() {
        console.log('Starting removing index.html suppresion noise.');

        let nonceCleared: number = 0,
            verifCardCleaned: boolean = false,
            removedReactStyles: boolean = false;

        try {
            const indexHTML = await fs.readFile(`${config.process_path}/index.html`, 'utf-8');
            const $ = cheerio.load(indexHTML);

            $('[nonce]').each((i, element) => {
                $(element).attr('nonce', 'REPLACED_BY_X-SCRAPER');
                nonceCleared++;
            });

            $('meta[name="twitter-site-verification"]').each((i, element) => {
                $(element).attr('content', 'REPLACED_BY_X-SCRAPER');
                verifCardCleaned = true;
            });

            $('style#react-native-stylesheet').each((i, element) => {
                const originalContent = $(element).html();

                if (originalContent) {
                    const cleaned = originalContent.replace(/^\s*\.r-vlxjld\b[^{]*\{[^}]*\}\s*$\n?/gm, '').replace(/^\s*\.r-yfoy6g\b[^{]*\{[^}]*\}\s*$\n?/gm, '');

                    $(element).html(cleaned);
                    removedReactStyles = true;
                }
            });

            console.info(`    [X-SCRAPER] Nonce cleared count: ${nonceCleared}`);
            console.info(`    [X-SCRAPER] twitter-site-verification meta tag is cleared: ${verifCardCleaned}`);
            console.info(`    [X-SCRAPER] react-native-stylesheet style classes cleared: ${removedReactStyles}`);

            let content = await prettier.format($.html(), {
                parser: 'html',
                tabWidth: 4,
                useTabs: false,
                printWidth: 2000,
            });

            content = content.replace(RegExp('gt=...................'), 'gt=0000000000000000000');
            content = content.replace(RegExp('guestId: ".................."'), 'guestId: "000000000000000000"');
            content = content.replace(RegExp('serverDate: .............,'), 'serverDate: 0000000000000,');
            content = content.replace(RegExp('userHash: "................................................................"'), 'userHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');

            await saveFile('index.html', content, config.process_path);
        } catch (error) {
            console.error('Error clearing index.html by clearHTML(): ', error);
        }

        console.log('Finished removing index.html supression noise.');
    }

    async getServiceWorkerScripts() {
        console.info('Started getServiceWorkerScripts method');
        try {
            const swFile = await fs.readFile(`${config.process_path}/sw.js`, 'utf-8');
            const swURL = swFile.match(/importScripts\s*\(\s*(['"])(.*?)\1/);

            if (swURL && swURL[2]) {
                console.info(`    [X-SCRAPER] Service Worker detected: ${swURL[2]}`);
                await getAsset(this.getFilename(swURL[2]), swURL[2], this.getPath(swURL[2]), 'js');
            }
        } catch (error) {
            console.error('Errror in getServiceWorkerScripts method: ', error);
        }
        console.info('Finished getServiceWorkerScripts method');
    }

    async getSHA() {
        console.info('Started getSHA method');
        try {
            const swFile = await fs.readFile(`${config.process_path}/sw.js`, 'utf-8');
            const SHA = swFile.match(/sha:\s*"([a-f0-9]{40})"/);

            if (SHA) {
                console.info(`    [X-SCRAPER] Release SHA: ${SHA[1]}`);
                return SHA[1];
            }
        } catch (error) {
            console.error('Error in getSHA method: ', error);
        }
        console.info('Finished getSHA method');
    }

    private getPath(url: string): string {
        if (!url.startsWith(`${config.domain.abs_twimg}/responsive-web`)) {
            return url;
        }

        const replacedPath = url.replace(`${config.domain.abs_twimg}/responsive-web`, `./${config.process_path}`);
        const pathSegments = replacedPath.split('/');

        pathSegments.pop();

        return pathSegments.join('/');
    }

    private getFilename(url: string): string {
        const filenameWithSHA = url.substring(url.lastIndexOf('/') + 1);
        return filenameWithSHA.replace(/^(.*)\.[a-f0-9]{8}(\.[^.]+)$/, '$1$2');
    }
}
