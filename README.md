# DocPub

[![npm](https://img.shields.io/npm/v/docpub.svg?maxAge=2592000)](https://www.npmjs.com/package/docpub)
[![Build Status](https://travis-ci.org/rakutentech/docpub.svg?branch=master)](https://travis-ci.org/rakutentech/docpub)
[![Coverage Status](https://coveralls.io/repos/github/rakutentech/docpub/badge.svg)](https://coveralls.io/github/rakutentech/docpub)

**DocPub** is a command line utility for converting a folder structure of markdown files to HTML and uploading the result to Zendesk.

## Getting Started

### Installing

To install the utility, use [npm](https://www.npmjs.org/) `install` command:

```sh
npm install -g docpub
```

Global installation is used for launching commands.

### Configuring

**DocPub** is configured using a config file. The only supported config file format is `JSON`.
By default, **DocPub** looks for the config in the root of documentation folder by `docpub.conf` name.
If needed, specific config location may be set with `--config-path` CLI option. Please note, that
this option accepts path to the file, not to the folder, where config is located

The minimal config must include following required options:

- `username` - name of ZenDesk user with documentation publish access rights
- `token` - access token of the user above
- `url` - fully qualified URL of your `ZenDesk` space

Example:
```javascript
{
    "username": "user@example.com"
    "token": "abc123def456ghi789"
    "url": "example.zendesk.com"
}
```
Please see more about other configuration options and options overriding in [config](doc/config.md) section.

### Running

Run the command `docpub` from the directory that you wish to convert and upload.

This will do the following:
- Convert the contained markdown files to HTML
- Create a new category on Zendesk which contains sections matching the specified path's folder structure
- Upload the HTML for each article into the corresponding section

**Note:** Alternatively, you can Run `docpub -p {path}` to run the utility on the specified path.

## Folder Structure and Metadata

This utility will convert and upload files for a single `Category` on the Zendesk Help Center. Before running the utility, the markdown files that you wish to convert and upload must be within a certain folder structure that follows that `Category` > `Section` > `Article` structure of Zendesk. Each folder must also contain a `meta.json` file that has metadata about the `Category`, `Section`, or `Article`.

See [Documentation Folder Structure](docs/folder-structure.md) for specifications on folder structure.
See [Metadata Format](docs/metadata.md) for specifications on the metadata file.

## Development Guide

### Getting Started

Run `npm install` to install dependencies. This will also setup the `precommit` and `preversion` hooks.

### Running Tests

Run `npm test` to run the tests under the `test` directory with [Mocha](https://github.com/mochajs/mocha).

Tests are divided into unit tests and functional tests, and utilize [SinonJS](http://sinonjs.org/) for spies, stubs, and mocks as well as [ChaiJS](http://chaijs.com/) for assertions.

### Precommit and Preversion Hooks

[husky](https://github.com/typicode/husky) is used to provide hooks prior to committing and versioning. This will run linter for commits and linter + all tests for releases.
If any of the tests fail to pass or any file doesn't meet the ESLint specifications, you will not be allowed to commit or version.
