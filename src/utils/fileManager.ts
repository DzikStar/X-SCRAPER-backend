import * as fs from 'node:fs/promises';
import * as path from 'path';
import logger from './logger.js';

export async function clearPath(targetPath: string): Promise<void> {
    logger.debug({ path: targetPath }, 'Removing directory');

    try {
        await fs.rm(targetPath, { recursive: true, force: true });
        logger.info({ path: targetPath }, 'Directory removed successfully');
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            logger.warn({ path: targetPath }, 'Directory does not exist, nothing to remove');
        } else {
            logger.error(
                {
                    path: targetPath,
                    err: error instanceof Error ? { message: error.message, code: (error as NodeJS.ErrnoException).code, stack: error.stack } : String(error),
                },
                'Failed to remove directory',
            );
            throw error;
        }
    }
}

export async function saveFile(fileName: string, fileContent: string, filePath: string = './'): Promise<void> {
    const fullPath = path.join(filePath, fileName);
    logger.debug({ file: fullPath }, 'Saving file');

    try {
        await fs.mkdir(filePath, { recursive: true });

        await fs.writeFile(fullPath, fileContent);

        logger.info({ file: fullPath, size: fileContent.length }, 'File saved successfully');
    } catch (error) {
        logger.error(
            {
                file: fullPath,
                err: error instanceof Error ? { message: error.message, code: (error as NodeJS.ErrnoException).code, stack: error.stack } : String(error),
            },
            'Failed to save file',
        );
        throw error;
    }
}
