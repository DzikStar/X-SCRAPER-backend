import { exec } from 'node:child_process';
import { config } from '../core/config.js';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class Github {
    private PAT: string;

    constructor() {
        this.PAT = process.env.GH_PERSONAL_ACCESS_TOKEN || '';
    }

    private async setRemote(PAT: string, outputRepo: string): Promise<void> {
        await execAsync(`git remote set-url origin https://x-access-token:${PAT}@github.com/${outputRepo}.git`);
    }

    private async setUser(username: string, usermail: string): Promise<void> {
        await execAsync(`git config user.name "${username}"`);
        await execAsync(`git config user.email "${usermail}"`);
    }

    async clone(repo: string): Promise<void> {
        await execAsync(`git clone https://github.com/${repo}.git`);
        console.info(`Cloned ${repo} repository.`);
    }

    async commit(message: string, path: string): Promise<void> {
        await execAsync(`git config user.name "${config.github.writer_username}"`, { cwd: path });
        await execAsync(`git config user.email "${config.github.writer_usermail}"`, { cwd: path });

        await execAsync(`git remote set-url origin https://x-access-token:${this.PAT}@github.com/${config.github.repos_owner}/${config.github.output_repo}.git`, { cwd: path });

        await execAsync('git add .', { cwd: path });
        await execAsync(`git commit --allow-empty -m "${message}"`, { cwd: path });
        await execAsync('git push origin main', { cwd: path });

        console.log('Changes pushed successfully');
    }
}
