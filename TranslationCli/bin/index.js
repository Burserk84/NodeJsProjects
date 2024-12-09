#!/usr/bin/env node

const { program } = require('commander');
const translate = require('translate-google');

// Basic language mapping
const languages = {
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
};

program
    .version('1.0.0')
    .description('Simple translation tool')
    .option('-l, --language <language>', 'language to translate to')
    .option('-s, --sentence <sentence>', 'sentence to translate')
    .option('--list', 'list available languages');

program.parse(process.argv);
const options = program.opts();

// Handle listing languages
if (options.list) {
    console.log('\nAvailable languages:');
    Object.keys(languages).forEach(lang => console.log(`- ${lang}`));
    process.exit(0);
}

// Check required options
if (!options.language || !options.sentence) {
    console.log('Error: Both language and sentence are required');
    console.log('Example: translate -l spanish -s "Hello world"');
    process.exit(1);
}

// Perform translation
const targetLang = options.language.toLowerCase();
const langCode = languages[targetLang];

if (!langCode) {
    console.log(`Error: Language "${targetLang}" is not supported`);
    console.log('Use --list to see available languages');
    process.exit(1);
}

translate(options.sentence, { to: langCode })
    .then(text => {
        console.log('\nTranslation:');
        console.log(`Original: ${options.sentence}`);
        console.log(`Translated: ${text}`);
    })
    .catch(err => {
        console.log('Translation error:', err.message);
    });