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
const DocpubPipeline = require('../lib/docpub');

program
    .version(pkg.version)
    .option('-v --verbose', 'verbose output')
    .option('-p --path <path>', 'path to documents directory (defaults to process directory)');

program.parse(process.argv);

const docpubPipeline = new DocpubPipeline(program);

docpubPipeline
    .uploadCategory()
    .catch(() => {
        process.exit(1);
    })
    .done();
