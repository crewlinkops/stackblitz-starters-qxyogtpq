const fs = require('fs');
const path = require('path');

const targetDir = 'f:\\AntiGravity\\Crewlink\\app';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        // Exclude node_modules or build folders just in case
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(targetDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Switch background cool gray (slate) to true charcoal (zinc)
    content = content.replace(/slate-/g, 'zinc-');

    // Switch primary action color from blue to emerald
    content = content.replace(/blue-/g, 'emerald-');

    // Switch secondary gradient/accent color from indigo to teal
    content = content.replace(/indigo-/g, 'teal-');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated theme classes in: ${file}`);
    }
});

console.log(`\nColor Overhaul Complete. Modified ${modifiedCount} files.`);
