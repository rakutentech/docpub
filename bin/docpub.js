#!/usr/bin/env node

/**
 * Binary for the Zendesk Pipeline. Provides CLI for users.
 * Setup for CLI (commands, options and arguments definition) + passing this arguments
 * to DocpubPipeline instance implemented here.
 *
 * This module shall contain as little code as possible because it's almost impossible to test it correctly
 */

const program = require('commander');
const pkg = require('../package.json');
const Docpub = require('../lib/docpub');

program
    .version(pkg.version)
    .option('-p, --path <path>', 'path to documents directory (defaults to process directory)')
    .option('--config-path <configPath>', 'path for the config')
    .option('-v, --verbose', 'verbose output');

program.on('--help', () => {
    console.log('  Overriding config');
    console.log('    To override any config option use full option path converted to --kebab-case');
    console.log('');

    console.log('    Examples:');
    console.log('      docpub --username user@example.com');
    console.log('      docpub --token abcdefghijklmn12345');
    console.log('');
    console.log('    You can also use environment variables converted to snake_case with');
    console.log('    docpub_ prefix');
    console.log('');
    console.log('    Examples:');
    console.log('      docpub_url=my-awesome-docs.zendesk.com docpub');
    console.log('      docpub_token=abcdefghijklmn12345 docpub');
    console.log('');
    console.log('    If both cli flag and env var are used, cli flag takes precedence') ;
});

program.parse(process.argv);

let docpub;

try {
    docpub = new Docpub(program);
} catch (e) {
    process.exit(1); // in case docpub failed to construct interface instance, unable to continue
}

docpub
    .uploadCategory()
    .catch(() => {
        process.exit(1);
    })
    .done();
