# Zendesk Pipeline

Zendesk Pipeline is a command line utility for converting a folder structure of markdown files to HTML and uploading the result to Zendesk.

## Prerequisites:

- [NodeJS](https://nodejs.org) >= v6.0.0

## Getting Started

1. Run `npm install` from the root of the project directory to install npm dependencies.
2. Set environment variables for your Zendesk username, token, and url by running the following commands:
    - `ZENDESK_API_USERNAME="{Your username}"`
    - `ZENDESK_API_TOKEN="{Your API token}"`
    - `ZENDESK_URL="{Your fully qualified Zendesk URL}"`

You can alternative create an enviroment profile in your home directory. Using bash, add the variables to your `.bash_profile`, if there is no file, create it.

```
export ZENDESK_API_USERNAME="{Your username}"
export ZENDESK_API_TOKEN="{Your API token}"
export ZENDESK_URL="{Your fully qualified Zendesk URL}"

```
    
Then check that the variables are included with `printprev`.

3. Run `npm run docpub -p {path}` to run the utility on the specified path. This will do the following:
    - convert the contained markdown files to HTML
    - create a new category on Zendesk which contains sections matching the specified path's folder structure
    - upload the HTML for each article into the corresponding section

**Note:** Alternatively, you can install the utility globally with `npm install -g` and then run the command `docpub` from the directory that you wish to convert and upload.

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

[husky](https://github.com/typicode/husky) is used to provide hooks prior to committing and versioning. This will run the unit and functional tests as well as [ESLint](http://eslint.org/) to make sure that the code style is correct and has no syntax errors.

If any of the tests fail to pass or any file doesn't meet the ESLint specifications, you will not be allowed to commit or version.

### Useful Links

- [Zendesk Help Center API](https://developer.zendesk.com/rest_api/docs/help_center/introduction)

## TODO

- Fix code highlighting by inlining `css` and `js` from `highlight.js` into the generated HTML
- Add config file with possibility to specify `zendeskUrl`, `username` and `token`
- Add to config possibility to specify category ID to be used by tool
- Add possibility to redefine each config entry with CLI option
- Add option `--force` which will enforce uploading without taking in account whether entity already uploaded and not modified from last upload
- Add typed errors: now in all cases generic errors are being reported, need to make them more specific and make error messages more verbose
- Discuss links for the between articles - now link will only work if it will point to article folder, not .md file
- Discuss possibility to deprecate `.meta.json` files and put all the meta information to specific folder in documentation root
