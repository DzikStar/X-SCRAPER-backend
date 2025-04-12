import { saveFile } from './fileManager.js';
import { config } from '../core/config.js';
import prettier from 'prettier';
import logger from './logger.js';

type FormatType = 'js' | 'html' | 'text';

export async function fetchFromURL(url: string): Promise<Response> {
    logger.debug({ url }, 'Fetching remote content');

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from ${url}: ${response.status} ${response.statusText}`);
        }

        logger.debug({ url, status: response.status }, 'Fetch completed successfully');
        return response;
    } catch (error) {
        logger.error(
            {
                url,
                err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
            },
            'Failed to fetch from URL',
        );
        throw error;
    }
}

export async function getAsset(name: string, url: string, savePath: string = `./${config.github.output_repo}`, formatting: 'js' | 'html' | 'text' = 'text'): Promise<void> {
    logger.debug({ name, url, savePath, formatting }, 'Downloading asset');

    try {
        const response = await fetchFromURL(url);
        const content = await response.text();

        let formattedContent: string;

        switch (formatting) {
            case 'js':
                logger.debug({ name }, 'Formatting JavaScript content');
                formattedContent = await prettier.format(content, {
                    parser: 'babel',
                    bracketSpacing: true,
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 2000,
                });
                break;

            case 'html':
                logger.debug({ name }, 'Formatting HTML content');
                formattedContent = await prettier.format(content, {
                    parser: 'html',
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 2000,
                });
                break;

            case 'text':
            default:
                formattedContent = content;
                break;
        }

        await saveFile(name, formattedContent, savePath);
        logger.info({ name, savePath }, 'Asset downloaded and saved successfully');
    } catch (error) {
        logger.error(
            {
                name,
                url,
                savePath,
                err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
            },
            'Failed to download and save asset',
        );
        throw error;
    }
}
