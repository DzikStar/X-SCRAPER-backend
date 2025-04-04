import { getAsset } from '@utils/downloadManager.js';

export default class Xscraper {
    async run() {
        getAsset('index.html', undefined, './xscraper', 'html');
        getAsset('sw.js', 'sw.js', './xscraper', 'js');
    }
}
