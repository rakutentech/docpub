const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');
const Category = require('./category');
const CategoryUploader = require('./zendesk-uploader/category-uploader');

const logger = require('./logger');
const chalk = require('chalk');

/**
 * ZendeskPipeline represents interface to utility. It is used as entry point for all operations.
 * It's interface methods represent a command utility support.
 * Must be initialised with args received from user.
 */
module.exports = class ZendeskPipeline {
    /**
     * Creates ZendeskPipeline instance
     * Options, received from user, must be passed to this constructor
     * If path passed, it would be resolved relatively to process.cwd()
     *
     * @param {Object} opts - options received from user.
     */
    constructor(opts) {
        opts = _.defaults(opts || {}, {
            path: process.cwd(),
            verbose: false
        });

        logger.setup(opts);

        this._path = path.resolve(opts.path);
    }

    /**
     * Performs upload to Zendesk action for all available documents
     * First reads the directory for all availblae items.
     * If read was correct, performs upload of this items.
     * If read or upload were rejected, rejects promise.
     * If everything was successful, resolves the promise
     *
     * @returns Promise - promise to be resolved when uploading finished
     */
    uploadCategory() {
        logger.info(`Start uploading.`);
        logger.info(`Category path: ${this._path}`);

        const category = new Category(this._path);

        return category.read()
            .then(() => {
                const categoryUploader = new CategoryUploader(category);

                return categoryUploader.upload();
            })
            .then(() => {
                logger.info(
                    chalk.green(`Successfully uploaded all entities for category ${this._path}`)
                );
            })
            .catch(e => {
                logger.error(`Upload failed!`);
                logger.error(e);

                return Promise.reject(e);
            });
    }
};
