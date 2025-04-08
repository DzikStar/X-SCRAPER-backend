import { WebClientScraper } from '../modules/webClientScraper.js';

export default class Xscraper {
    public scrapers: { [key: string]: { start: () => Promise<unknown> } };

    constructor() {
        this.scrapers = {
            'web-client': new WebClientScraper(),
            // 'flags': new FlagsScraper()
        };
    }

    async run(scraperType = 'web-client') {
        console.log(`Starting run method for scraper type: ${scraperType}`);
        try {
            const scraper = this.scrapers[scraperType];

            if (!scraper) {
                throw new Error(`${scraperType}: scraper doesn't exist`);
            }

            await scraper.start();
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error in run method: ${error.message}`);
            } else {
                console.error(`Error in run method: ${error}`);
            }
        } finally {
            console.log(`Ending run method for scraper type: ${scraperType}`);
        }
    }
}
