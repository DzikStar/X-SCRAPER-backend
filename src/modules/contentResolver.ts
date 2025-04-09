import * as cheerio from 'cheerio';
import * as prettier from 'prettier';
import { promises as fs } from 'node:fs';
import { saveFile } from '../utils/fileManager.js';
import { config } from '../core/config.js';

export class ContentResolver {
    async clearHTML() {
        console.log('Starting removing index.html suppresion noise.');

        let nonceCleared: number = 0;

        try {
            const indexHTML = await fs.readFile(`${config.process_path}/index.html`, 'utf-8');
            const $ = cheerio.load(indexHTML);

            $('[nonce]').each((i, element) => {
                $(element).attr('nonce', 'REPLACED_BY_X-SCRAPER');
                nonceCleared++;
            });

            console.log(`   [X-SCRAPER] Nonce cleared count: ${nonceCleared}`);

            const content = prettier.format(await $.html(), {
                parser: 'html',
                tabWidth: 4,
                useTabs: false,
                printWidth: 2000,
            });

            await saveFile('index.html', await content, config.process_path);
        } catch (error) {
            console.error('Error clearing index.html by clearHTML(): ', error);
        }

        console.log('Finished removing index.html supression noise.');
    }
}
