require('any-promise/register/bluebird');

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-promise');

/**
 * Checks if path is a directory.
 * If passed relative path, it will be processed relatively to `process.cwd()`
 * If passed path is not string or empty, returns false.
 * If passed path is not directory, returns false.
 * If passed path is directory, returns true.
 *
 * @param  {string} srcPath Path to check
 * @return {boolean} result of checking the path
 */
const isDirectory = function(srcPath) {
    if (!srcPath) {
        return false;
    }

    try {
        return fs.statSync(srcPath).isDirectory();
    } catch (e) {
        return false;
    }
};

/**
 * Looks for the file in directory
 * If srcDir is a relative path, it will be processed relatively to `process.cwd()`
 * If file path or name are not strings or empty, rejects the promise.
 * If path is not a directory, rejects the promise
 * If file is not is diretory or not accessible, rejects the promise.
 * If file presented in directory and accessible, resolves the promise with `srcDir/name` path to file.
 *
 * @param  {string} srcDir path to directory where to search for file.
 * @param  {string} name file name to search for. File name must be passed with extension.
 * @return {Promise} Promise to be resolved with file path.
 */
const findFile = function(srcDir, name) {
    return checkStringParam(srcDir, 'Source directory path')
        .then(() => checkStringParam(name, 'File name'))
        .then(() => checkIsDirExists(srcDir))
        .then(() => {
            const filePath = path.join(srcDir, name);

            return fs.access(filePath)
                .then(() => path.join(srcDir, name))
                .catch(e => {
                    const msg = `File ${filePath} does not exist or not readable. Error: ${e}`;
                    return Promise.reject(new Error(msg));
                });
        });
};

/**
 * Lists subirectories in required directory
 * If srcPath is a relative path, it will be processed relatively to `process.cwd()`
 * if srcPath is not string or empty, rejects the promise
 * if srcPath is not a directory, rejects the promise
 * If failed to receive stats from any of source dir entries, this entry is being filtered out from results
 * If was able to successfully read directory, resolves promise with list of subfolders names prepended with `srcPath`
 * i.e. `srcPath/subfolder`
 *
 * @param  {string} srcPath path to directory to list subfolders
 * @return {Promise} promise to be resolved with subfolders paths
 */
const listSubdirectories = function(srcPath) {
    return checkStringParam(srcPath, 'Source path')
        .then(() => checkIsDirExists(srcPath))
        .then(() => fs.readdir(srcPath))
        .filter(entry => {
            const subdirPath = path.join(srcPath, entry);

            return fs.stat(subdirPath)
                .then(stat => {
                    return stat.isDirectory();
                })
                .catch(() => {
                    return false;
                });
        })
        .map(entry => path.join(srcPath, entry));
};

function checkIsDirExists(dir) {
    return isDirectory(dir)
        ? Promise.resolve()
        : Promise.reject(new Error(`${dir} does not exists or not readable`));
}

function checkStringParam(param, displayName) {
    if (typeof param !== 'string') {
        return Promise.reject(new Error(`${displayName} must be a string`));
    }

    if (!param.length) {
        return Promise.reject(new Error(`${displayName} is empty`));
    }

    return Promise.resolve();
}

exports.isDirectory = isDirectory;
exports.findFile = findFile;
exports.listSubdirectories = listSubdirectories;
