import { execSync } from 'node:child_process';
import { config } from '../core/config.js';
import logger from '../utils/logger.js';

export class Github {
    private PAT: string;

    constructor() {
        this.PAT = process.env.GH_PERSONAL_ACCESS_TOKEN || '';
    }

    private setRemote(PAT: string, outputRepo: string): void {
        logger.debug({ repo: outputRepo }, 'Setting git remote URL');
        
        try {
            const maskedPAT = PAT ? `${PAT.substring(0, 4)}...${PAT.substring(PAT.length - 4)}` : 'not-provided';
            logger.debug({ repo: outputRepo, token: maskedPAT }, 'Configuring remote with access token');
            
            execSync(`git remote set-url origin https://x-access-token:${PAT}@github.com/${outputRepo}.git`);
            logger.info({ repo: outputRepo }, 'Git remote URL configured successfully');
        } catch (error) {
            logger.error(
                { 
                    repo: outputRepo, 
                    err: error instanceof Error 
                        ? { message: error.message, stack: error.stack } 
                        : String(error) 
                },
                'Failed to set git remote URL'
            );
            throw error;
        }
    }

    private setUser(username: string, usermail: string): void {
        logger.debug({ username, email: usermail }, 'Setting git user configuration');
        
        try {
            execSync(`git config user.name "${username}"`);
            execSync(`git config user.email "${usermail}"`);
            logger.info({ username }, 'Git user configuration set successfully');
        } catch (error) {
            logger.error(
                { 
                    username,
                    email: usermail,
                    err: error instanceof Error 
                        ? { message: error.message, stack: error.stack } 
                        : String(error)
                },
                'Failed to set git user configuration'
            );
            throw error;
        }
    }

    clone(repo: string): void {
        logger.info({ repo }, 'Cloning GitHub repository');
        
        try {
            execSync(`git clone --depth 1 https://github.com/${repo}.git`);
            logger.info({ repo }, 'Repository cloned successfully');
        } catch (error) {
            logger.error(
                { 
                    repo, 
                    err: error instanceof Error 
                        ? { message: error.message, stack: error.stack } 
                        : String(error)
                },
                'Failed to clone repository'
            );
            throw error;
        }
    }
    
    commit(message: string, path: string): void {
        logger.info({ path, message }, 'Preparing to commit changes');
        
        try {
            logger.debug({ path }, 'Setting git configuration');
            execSync(`git config user.name "${config.github.writer_username}"`, { cwd: path });
            execSync(`git config user.email "${config.github.writer_usermail}"`, { cwd: path });

            const maskedPAT = this.PAT ? `${this.PAT.substring(0, 4)}...${this.PAT.substring(this.PAT.length - 4)}` : 'not-provided';
            logger.debug({ path, token: maskedPAT }, 'Setting git remote URL with access token');
            execSync(`git remote set-url origin https://x-access-token:${this.PAT}@github.com/${config.github.repos_owner}/${config.github.output_repo}.git`, { cwd: path });

            // Check for changes
            const hasChanges = !!execSync('git status --porcelain', { cwd: path, encoding: 'utf-8' }).trim();
            
            if (!hasChanges) {
                logger.info({ path }, 'No changes detected, skipping commit');
                return;
            }
            
            // Commit and push changes
            logger.debug({ path }, 'Adding changes to git index');
            execSync('git add .', { cwd: path });
            
            logger.debug({ path, message }, 'Committing changes');
            execSync(`git commit -m "${message}"`, { cwd: path });
            
            logger.info({ path }, 'Pushing changes to remote repository');
            execSync('git push origin main', { cwd: path });

            logger.info({ path, message }, 'Changes committed and pushed successfully');
        } catch (error) {
            logger.error(
                { 
                    path, 
                    message,
                    err: error instanceof Error 
                        ? { message: error.message, stack: error.stack } 
                        : String(error)
                },
                'Failed to commit and push changes'
            );
            throw error;
        }
    }
}
