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
        const scraper = this.scrapers[scraperType];

        if (!scraper) {
            throw new Error(`${scraperType}: scraper doesn't exists`);
        }

        return scraper.start();
    }
}
