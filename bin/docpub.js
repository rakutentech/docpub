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
    .option('--doc-path <docPath>', 'path to documents directory (defaults to process directory)')
    .option('--config-path <configPath>', 'path for the config')
    .option('-v --verbose', 'verbose output');

program.parse(process.argv);

const docpub = new Docpub(program);

docpub
    .uploadCategory()
    .catch(() => {
        process.exit(1);
    })
    .done();
