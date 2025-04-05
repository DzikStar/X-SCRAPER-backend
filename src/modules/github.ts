import { execSync } from 'node:child_process';
import { loadConfig } from '../utils/fileManager.js';

export class Github {
    private PAT: string;
    private outputRepo: string;
    private username: string;
    private usermail: string;

    constructor() {
        const cnfg = loadConfig();

        this.PAT = process.env.GH_PERSONAL_ACCESS_TOKEN || '';
        this.outputRepo = cnfg['github']['output_repo'];    
        this.username = cnfg['github']['writer_username'];
        this.usermail = cnfg['github']['writer_usermail'];
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
        execSync(`git config --global user.name "${this.username}"`);
        execSync(`git config --global user.email "${this.usermail}"`);

        execSync(`git remote set-url origin https://x-access-token:${this.PAT}@github.com/${this.outputRepo}.git`, { cwd: path });

        execSync('git add .', { cwd: path });
        execSync(`git commit --allow-empty -m "${message}"`, { cwd: path });
        execSync('git push origin main', { cwd: path });
        
        console.log('Changes pushed successfully');
    }
}