import { saveFile } from './fileManager.js';
import { config } from '../core/config.js';
import prettier from 'prettier';

export async function fetchFromURL(route?: string): Promise<Response | undefined> {
    try {
        return await fetch(`https://x.com/${route}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.warn(`[ERROR] fetchFromURL() \n ${error}`);
    }
}

export async function getAsset(name: string, route?: string, savePath: string = `./${config.github.output_repo}`, formatting: 'text' | 'js' | 'html' = 'text'): Promise<void> {
    const response = await fetchFromURL(route);

    let content: string | undefined;

    if (response) {
        content = await response.text();
    } else {
        process.exit();
    }

    let formattedContent: string | undefined;

    switch (formatting) {
        case 'js':
            formattedContent = await prettier.format(content, {
                parser: 'babel',
                tabWidth: 4,
                useTabs: false,
                printWidth: 2000,
            });
            break;
        case 'html':
            formattedContent = await prettier.format(content, {
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
}
