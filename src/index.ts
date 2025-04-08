import Xscraper from './core/xscraper.js';

console.log('Script started');

try {
    const xscraper = new Xscraper();
    await xscraper.run();
} catch (error) {
    console.error('Error running Xscraper:', error);
}

console.log('Script ended');
