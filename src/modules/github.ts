import { execSync } from 'node:child_process';
import { config } from '../core/config.js';

export class Github {
    private PAT: string;

    constructor() {
        this.PAT = process.env.GH_PERSONAL_ACCESS_TOKEN || '';
    }

    private setRemote(PAT: string, outputRepo: string) {
        console.log('Setting remote URL');
        try {
            execSync(`git remote set-url origin https://x-access-token:${PAT}@github.com/${outputRepo}.git`);
        } catch (error) {
            console.error('Error setting remote URL:', error);
        }
        console.log('Remote URL set');
    }

    private setUser(username: string, usermail: string): void {
        console.log('Setting user configuration');
        try {
            execSync(`git config user.name "${username}"`);
            execSync(`git config user.email "${usermail}"`);
        } catch (error) {
            console.error('Error setting user configuration:', error);
        }
        console.log('User configuration set');
    }

    clone(repo: string): void {
        console.log(`Cloning repository: ${repo}`);
        try {
            execSync(`git clone https://github.com/${repo}.git`);
            console.info(`Cloned ${repo} repository.`);
        } catch (error) {
            console.error(`Error cloning repository ${repo}:`, error);
        }
        console.log(`Finished cloning repository: ${repo}`);
    }

    commit(message: string, path: string): void {
        console.log(`Committing changes to repository at path: ${path}`);
        try {
            execSync(`git config user.name "${config.github.writer_username}"`, { cwd: path });
            execSync(`git config user.email "${config.github.writer_usermail}"`, { cwd: path });

            execSync(`git remote set-url origin https://x-access-token:${this.PAT}@github.com/${config.github.repos_owner}/${config.github.output_repo}.git`, { cwd: path });

            execSync('git add .', { cwd: path });
            execSync(`git commit --allow-empty -m "${message}"`, { cwd: path });
            execSync('git push origin main', { cwd: path });

            console.log('Changes pushed successfully');
        } catch (error) {
            console.error('Error committing changes:', error);
        }
        console.log(`Finished committing changes to repository at path: ${path}`);
    }
}
