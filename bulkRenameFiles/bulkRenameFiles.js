const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const yargs = require('yargs');

// Parse command-line arguments
const argv = yargs
    .option('input', {
        alias: 'i',
        description: 'Path to the input directory',
        type: 'string',
        demandOption: true,
    })
    .option('output', {
        alias: 'o',
        description: 'Path to the output directory',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

const inputPath = path.resolve(argv.input);
const outputPath = argv.output ? path.resolve(argv.output) : inputPath;

fs.readdir(inputPath, (err, files) => {
    if (err) {
        console.error('Error reading input directory:', err);
        return;
    }

    files.forEach((file) => {
        const inputFile = path.join(inputPath, file);
        const outputFile = path.join(outputPath, file);

        // Check if the file is an image by extension
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())) {
            console.log(`Skipping non-image file: ${file}`);
            return;
        }

        sharp(inputFile)
            .resize({ width: 800 }) // Example resize, adjust as needed
            .toFile(outputFile, (err) => {
                if (err) {
                    console.error(`Error compressing file ${file}:`, err);
                } else {
                    console.log(`Compressed: ${file} -> ${outputFile}`);
                }
            });
    });
});
