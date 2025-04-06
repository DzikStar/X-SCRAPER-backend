import { execSync } from 'node:child_process';
import { config } from '../core/config.js';

export class Github {
    private PAT: string;

    constructor() {
        this.PAT = process.env.GH_PERSONAL_ACCESS_TOKEN || '';
    }

    private setRemote(PAT: string, outputRepo: string) {
        execSync(`git remote set-url origin https://x-access-token:${PAT}@github.com/${outputRepo}.git`);
    }

    private setUser(username: string, usermail: string): void {
        execSync(`git config user.name "${username}"`);
        execSync(`git config user.email "${usermail}"`);
    }

    clone(repo: string): void {
        execSync(`git clone https://github.com/${repo}.git`);
        console.info(`Cloned ${repo} repository.`);
    }

    commit(message: string, path: string): void {
        execSync(`git config user.name "${config.github.writer_username}"`, { cwd: path });
        execSync(`git config user.email "${config.github.writer_usermail}"`, { cwd: path });

        execSync(`git remote set-url origin https://x-access-token:${this.PAT}@github.com/${config.github.repos_owner}/${config.github.output_repo}.git`, { cwd: path });

        execSync('git add .', { cwd: path });
        execSync(`git commit --allow-empty -m "${message}"`, { cwd: path });
        execSync('git push origin main', { cwd: path });

        console.log('Changes pushed successfully');
    }
}
