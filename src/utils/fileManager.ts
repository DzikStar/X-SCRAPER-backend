import * as fs from 'node:fs/promises';
import * as path from 'path';

export async function clearPath(targetPath: string): Promise<void> {
    console.log('Starting clearPath method');
    try {
        await fs.rm(targetPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`[ERROR] PATH NOT CLEARED: ${error}`);
    } finally {
        console.log('Ending clearPath method');
    }
}

export async function saveFile(fileName: string, fileContent: string, filePath: string = './'): Promise<void> {
    console.log('Starting saveFile method');
    try {
        const fullPath = path.join(filePath, fileName);
        await fs.mkdir(filePath, { recursive: true });
        await fs.writeFile(fullPath, fileContent);
    } catch (error) {
        console.error(`[ERROR] FILE NOT SAVED: ${error}`);
    } finally {
        console.log('Ending saveFile method');
    }
}
