const fs = require('fs');
const path = require('path');

function removeEmojis(text) {
    // A comprehensive regex to match emojis, using Unicode property escapes
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = removeEmojis(content);
            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Cleaned', fullPath);
            }
        }
    }
}

processDirectory('/Users/mac/Desktop/SPARK/src');
