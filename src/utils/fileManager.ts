import * as fs from 'node:fs/promises';
import * as path from 'path';

export async function clearPath(targetPath: string): Promise<void> {
    try {
        await fs.rm(targetPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`[ERROR] PATH NOT CLEARED: ${error}`);
    }
}

export async function saveFile(fileName: string, fileContent: string, filePath: string = './'): Promise<void> {
    try {
        const fullPath = path.join(filePath, fileName);
        await fs.mkdir(filePath, { recursive: true });
        const file = await fs.open(fullPath, 'w');
        try {
            await file.write(fileContent);
        } finally {
            await file.close();
        }
    } catch (error) {
        console.error(`[ERROR] FILE NOT SAVED: ${error}`);
    }
}
