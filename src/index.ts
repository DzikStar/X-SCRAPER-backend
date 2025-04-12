import Xscraper from './core/xscraper.js';
import logger from './utils/logger.js';

logger.info('X-SCRAPER service starting...');

try {
    const xscraper = new Xscraper();
    await xscraper.run();
    logger.info('X-SCRAPER service completed successfully');
} catch (error) {
    logger.error({ err: error }, 'Failed to run X-SCRAPER service');
    process.exit(1);
}
