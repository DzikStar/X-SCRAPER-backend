import { WebClientScraper } from '../modules/webClientScraper.js';
import logger from '../utils/logger.js';

export type ScraperType = 'web-client'; // Add more types as needed

export interface Scraper {
    start(): Promise<unknown>;
}

export default class Xscraper {
    private scrapers: Record<string, Scraper>;

    constructor() {
        this.scrapers = {
            'web-client': new WebClientScraper(),
            // 'flags': new FlagsScraper()
        };
    }

    async run(scraperType: ScraperType = 'web-client'): Promise<void> {
        logger.info({ scraperType }, 'Starting scraper');
        
        const scraper = this.scrapers[scraperType];

        if (!scraper) {
            const error = new Error(`Scraper '${scraperType}' is not available`);
            logger.error({ scraperType, error }, 'Scraper not found');
            throw error;
        }

        try {
            await scraper.start();
            logger.info({ scraperType }, 'Scraper completed successfully');
        } catch (error) {
            logger.error(
                { 
                    scraperType, 
                    err: error instanceof Error 
                        ? { message: error.message, stack: error.stack } 
                        : String(error)
                }, 
                'Scraper failed'
            );
            throw error;
        }
    }
}
