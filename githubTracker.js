const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';

// Optional: Add your GitHub token for higher rate limits
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

// Debug: Log token status (showing only first/last 4 chars for security)
if (GITHUB_TOKEN) {
    const tokenPreview = `${GITHUB_TOKEN.substring(0, 4)}...${GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4)}`;
    console.log(`🔑 GitHub token loaded: ${tokenPreview}`);
} else {
    console.log('⚠️  No GitHub token found in environment');
}

const axiosInstance = axios.create({
    baseURL: GITHUB_API_BASE,
    headers: GITHUB_TOKEN ? {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    } : {
        'Accept': 'application/vnd.github.v3+json'
    }
});

/**
 * Verify if a repository exists and is accessible
 */
async function verifyRepository(owner, repo) {
    try {
        const response = await axiosInstance.get(`/repos/${owner}/${repo}`);
        console.log(`✅ Successfully verified repository: ${owner}/${repo}`);
        return response.status === 200;
    } catch (error) {
        console.error(`❌ Failed to verify repository ${owner}/${repo}`);
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Message: ${error.message}`);
        if (error.response?.status === 404) {
            console.error(`   → Repository not found or you don't have access`);
            console.error(`   → Make sure your GitHub token has 'repo' scope (not just 'public_repo')`);
            console.error(`   → Verify you have access to this private repository`);
        } else if (error.response?.status === 401) {
            console.error(`   → Authentication failed - check your GITHUB_TOKEN in .env`);
        }
        return false;
    }
}

/**
 * Get recent commits from a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} since - Only return commits newer than this SHA
 * @returns {Array} Array of commit objects
 */
async function getRecentCommits(owner, repo, branch = 'main', sinceCommitSha = null) {
    try {
        const params = {
            sha: branch,
            per_page: 10
        };
        
        const response = await axiosInstance.get(`/repos/${owner}/${repo}/commits`, { params });
        
        if (!response.data || response.data.length === 0) {
            return [];
        }
        
        // If we have a previous commit SHA, only return commits newer than it
        if (sinceCommitSha) {
            const newCommits = [];
            for (const commit of response.data) {
                if (commit.sha === sinceCommitSha) {
                    break;
                }
                newCommits.push(commit);
            }
            return newCommits;
        }
        
        // First time checking this repo, return only the most recent commit
        return [response.data[0]];
        
    } catch (error) {
        if (error.response?.status === 404) {
            console.error(`Repository or branch not found: ${owner}/${repo}/${branch}`);
        } else if (error.response?.status === 403) {
            console.error('GitHub API rate limit exceeded. Consider adding a GITHUB_TOKEN to .env');
        } else {
            console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
        }
        return [];
    }
}

/**
 * Get repository information
 */
async function getRepositoryInfo(owner, repo) {
    try {
        const response = await axiosInstance.get(`/repos/${owner}/${repo}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching repository info for ${owner}/${repo}:`, error.message);
        return null;
    }
}

/**
 * Get authenticated user information
 * Returns null if no token is set or if authentication fails
 */
async function getAuthenticatedUser() {
    if (!GITHUB_TOKEN) {
        return null;
    }
    
    try {
        const response = await axiosInstance.get('/user');
        return response.data;
    } catch (error) {
        console.error('Error fetching authenticated user:', error.message);
        return null;
    }
}

module.exports = {
    verifyRepository,
    getRecentCommits,
    getRepositoryInfo,
    getAuthenticatedUser
};
