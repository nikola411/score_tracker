const fs = require('fs');
const path = require('path');
const readCache = (file) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content) return null;
        return JSON.parse(content);
    }

    return null;
};

const writeCache = (file, data) => {
    if (!fs.existsSync(file)) {
        fs.mkdirSync(path.dirname(file), { recursive: true }); // creates parent dirs too
        fs.writeFileSync(file, '');
    }
    fs.writeFileSync(file, JSON.stringify(data));
};

const appendCache = (file, data) => {
    if (!fs.existsSync(file)) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
    }
    let existing = [];
    try {
        const content = fs.readFileSync(file, 'utf8');
        if (content) existing = JSON.parse(content);
    } catch {}
    existing.push(data);
    fs.writeFileSync(file, JSON.stringify(existing));
}

module.exports = { readCache, writeCache, appendCache };