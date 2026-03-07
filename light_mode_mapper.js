const fs = require('fs');
const path = require('path');

const targetDir = 'f:\\AntiGravity\\Crewlink\\app';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
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

    // Backgrounds
    content = content.replace(/bg-zinc-950(?![\/\-])/g, 'bg-zinc-50 dark:bg-zinc-950');
    content = content.replace(/bg-zinc-950\/(\d+)/g, 'bg-zinc-100 dark:bg-zinc-950/$1');
    content = content.replace(/bg-zinc-900(?![\/\-])/g, 'bg-zinc-100 dark:bg-zinc-900');
    content = content.replace(/bg-zinc-900\/(\d+)/g, 'bg-zinc-100/$1 dark:bg-zinc-900/$1');
    content = content.replace(/bg-zinc-800(?![\/\-])/g, 'bg-zinc-200 dark:bg-zinc-800');
    content = content.replace(/bg-zinc-800\/(\d+)/g, 'bg-zinc-200/$1 dark:bg-zinc-800/$1');
    content = content.replace(/bg-zinc-700(?![\/\-])/g, 'bg-zinc-300 dark:bg-zinc-700');

    // Text Whites & Grays
    content = content.replace(/text-white(?![\/\-])/g, 'text-zinc-900 dark:text-white');
    content = content.replace(/text-zinc-200(?![\/\-])/g, 'text-zinc-800 dark:text-zinc-200');
    content = content.replace(/text-zinc-300(?![\/\-])/g, 'text-zinc-700 dark:text-zinc-300');
    content = content.replace(/text-zinc-400(?![\/\-])/g, 'text-zinc-600 dark:text-zinc-400');
    content = content.replace(/text-zinc-500(?![\/\-])/g, 'text-zinc-500 dark:text-zinc-500');

    // Borders
    content = content.replace(/border-white\/(\d+)/g, 'border-zinc-200 dark:border-white/$1');
    content = content.replace(/border-zinc-800(?![\/\-])/g, 'border-zinc-200 dark:border-zinc-800');
    content = content.replace(/border-zinc-700(?![\/\-])/g, 'border-zinc-300 dark:border-zinc-700');

    // Shadows
    content = content.replace(/shadow-xl(?! )/g, 'shadow-md dark:shadow-xl');
    content = content.replace(/shadow-2xl(?! )/g, 'shadow-xl dark:shadow-2xl');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Added light-mode variants in: ${file}`);
    }
});

console.log(`\nLight/Dark mapping complete. Modified ${modifiedCount} files.`);
