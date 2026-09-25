const fs = require('fs');
const path = require('path');

function processFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const r of replacements) {
        content = content.replace(r.regex, r.replacement);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + filePath);
    }
}

const dir = 'src';
function walk(d) {
    if (!fs.existsSync(d)) return [];
    let results = [];
    const list = fs.readdirSync(d);
    list.forEach(file => {
        file = path.join(d, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk(dir);
const replacements = [
    { regex: /import .* from ['"]core\/.*['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/components\/OnboardingCard['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/components\/OnboardingCard['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/OnboardingCard['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/pages\/AddNewModel\/configs\/.*['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/pages\/AddNewModel\/configs\/.*['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/forms\/AddModelForm['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/ModeSelect['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/\.\.\/pages\/AddNewModel\/configs\/.*['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/redux\/thunks\/.*['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/redux\/thunks\/edit['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/redux\/thunks\/edit['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\/ToolTruncateHistoryIcon['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/modelSelection\/ModelSelect['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\/Lump['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/Lump\/useEditBlock['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/mainInput\/Lump\/useEditBlock['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/pages\/config\/sections\/docs\/DocsIndexingPeeks['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/\.\.\/redux\/slices\/editState['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/redux\/slices\/editState['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/redux\/thunks\/callToolById['"];?\n?/g, replacement: '' },
    { regex: /import .* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/redux\/thunks\/cancelToolCall['"];?\n?/g, replacement: '' }
];

files.forEach(f => {
    if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        processFile(f, replacements);
    }
});
