import { saveFile } from './fileManager.js';
import { config } from '../core/config.js';
import prettier from 'prettier';

export async function fetchFromURL(url: string) {
    console.log('Starting fetchFromURL method');
    try {
        return await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error(`[ERROR] fetchFromURL() \n ${error}`);
    } finally {
        console.log('Ending fetchFromURL method');
    }
}

export async function getAsset(name: string, url: string, savePath: string = `./${config.github.output_repo}`, formatting = 'text') {
    console.log('Starting getAsset method');
    try {
        const response = await fetchFromURL(url);

        let content: string | undefined;

        if (response) {
            content = await response.text();
        } else {
            process.exit();
        }

        let formattedContent;

        switch (formatting) {
            case 'js':
                formattedContent = await prettier.format(await content, {
                    parser: 'babel',
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 2000,
                });
                break;
            case 'html':
                formattedContent = await prettier.format(await content, {
                    parser: 'html',
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 2000,
                });
                break;
            case 'text':
                formattedContent = content;
                break;
        }

        await saveFile(name, formattedContent || '', savePath);
    } catch (error) {
        console.error(`[ERROR] getAsset() \n ${error}`);
    } finally {
        console.log('Ending getAsset method');
    }
}
