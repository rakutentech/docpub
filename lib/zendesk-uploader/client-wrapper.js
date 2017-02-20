const request = require('request');
const fs = require('fs');
const constants = require('./constants');

/**
 * Wrapper class for the `node-zendesk` api client
 * Wraps all requests in the `articles`, `sections`, `categories`, and `accesspolcies` objects in Promises
 * Also wraps requests with a retry functionality that will retry the request if the error response is >= 500 or contains a `retryAfter` property
 */

const MAX_RETRIES = 5;
const RETRY_AFTER_DEFAULT = 500;

module.exports = class ZendeskClientWrapper {
    /**
     * Creates a wrapper around the provided node-zendesk api client
     * @param {object} client - the node-zendesk client to wrap (object returned by zendesk::createClient() )
     */
    constructor(client) {
        this._client = client;
        const endpoints = [
            'articles',
            'articleattachments',
            'sections',
            'accesspolicies',
            'categories'
        ];
        endpoints.forEach(endpoint => {
            this._wrapPrototypeMethods(endpoint);
        });
        // This method must be created manually because the API client doesn't have it
        this.articleattachments.create = (articleId, resourcePath) => this._createPromiseRequest(this._createAttachment, articleId, resourcePath);
    }

    _wrapPrototypeMethods(property) {
        if (!this._client.hasOwnProperty(property)) {
            return;
        }
        const prototype = Object.getPrototypeOf(this._client[property]);
        this[property] = {};
        for (const method in prototype) {
            if (typeof prototype[method] === 'function') {
                this._createMethod(this[property], this._client[property], method);
            }
        }
    }

    _createMethod(property, client, method) {
        property[method] = (...args) => {
            args = [client[method]].concat(args);
            // Passes the method's parent object as `this` value - for example `client.articles`
            return this._createPromiseRequest.apply(client, args);
        };
    }

    _createPromiseRequest() {
        let retries = MAX_RETRIES;
        // First param is the method to call - subsequent params will be passed to the method
        const args = [].slice.call(arguments);
        const method = args.shift();
        return new Promise((resolve, reject) => {
            args.push((err, req, result) => {
                if (!err) {
                    return resolve(result);
                } else if ((err.retryAfter || err.statusCode >= 500) && retries > 0) {
                    // err.retryAfter is present on all 429 (rate limit has been exceeded) and some 503 errors
                    // err.retryAfter is time to wait in seconds
                    retries--;
                    let retryAfter = err.retryAfter ? err.retryAfter * 1000 : RETRY_AFTER_DEFAULT;
                    setTimeout(() => method.apply(this, args), retryAfter);
                } else {
                    return reject(err);
                }
            });
            method.apply(this, args);
        });
    }

    _createAttachment(articleId, resourcePath, callback) {
        const endpoint = `/articles/${articleId}/attachments.json`;
        const params = this._buildAuthRequest(endpoint);
        params.formData = {
            // The request module will throw errors if you try to send this as a boolean instead of a string
            inline: 'true',
            file: fs.createReadStream(resourcePath)
        };

        request.post(params, (error, response, result) => {
            result = result ? JSON.parse(result)[constants.ARTICLE.ATTACHMENT] : null;
            error = this._buildError(error, response);
            callback(error, response, result);
        });
    }

    _buildAuthRequest(endpoint) {
        const params = {};
        const url = this._client.articles.options.get('remoteUri');
        const user = this._client.articles.options.get('username');
        const password = this._client.articles.options.get('password');
        const token = this._client.articles.options.get('token');
        const useOAuth = this._client.articles.options.get('oauth');

        params.url = url + endpoint;

        params.auth = {};
        if (useOAuth) {
            // Set bearer token if using OAuth
            params.auth.bearer = token;
        } else if (password) {
            // Use password auth if password is set
            params.auth.user = user;
            params.auth.pass = password;
        } else {
            // Use API token as default
            params.auth.user = `${user}/token`;
            params.auth.pass = token;
        }

        return params;
    }

    _buildError(error, response) {
        if (!error && response.statusCode >= 400) {
            error = {};
            error.statusCode = response.statusCode;
        }
        if (response.headers && response.headers['retry-after']) {
            error = error || {};
            error.retryAfter = response.headers['retry-after'];
        }
        return error;
    }
};
