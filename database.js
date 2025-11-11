const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'channelMappings.json');

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

/**
 * Load channel mappings from file
 */
async function loadChannelMappings() {
    try {
        await ensureDataDirectory();
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist yet, return empty object
            return {};
        }
        console.error('Error loading channel mappings:', error);
        return {};
    }
}

/**
 * Save channel mappings to file
 */
async function saveChannelMappings(mappings) {
    try {
        await ensureDataDirectory();
        await fs.writeFile(DB_FILE, JSON.stringify(mappings, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving channel mappings:', error);
        return false;
    }
}

module.exports = {
    loadChannelMappings,
    saveChannelMappings
};
