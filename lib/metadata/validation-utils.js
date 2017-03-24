const _ = require('lodash');

/**
 * Validation helper which checks is value a number. In case it's not, throws error.
 * Otherwise does nothing.
 *
 * @throws {Error} - throws exception if validation failed
 *
 * @param {any} value - value received from json
 */
function shouldBeNumber(value) {
    checkType(value, 'number');
}

/**
 * Validation helper which checks is value a string. In case it's not, throws error.
 * Otherwise does nothing.
 *
 * @throws {Error} - throws exception if validation failed
 *
 * @param {any} value - value received from json
 */
function shouldBeString(value) {
    checkType(value, 'string');
}

/**
 * Validation helper which checks is value a boolean. In case it's not, throws error.
 * Otherwise does nothing.
 *
 * @throws {Error} - throws exception if validation failed
 *
 * @param {any} value - value received from json
 */
function shouldBeBoolean(value) {
    checkType(value, 'boolean');
}

function checkType(value, type) {
    const valueType = typeof value;
    if (valueType !== type) {
        throw new Error(`Value ${value} must be a ${type}, got ${valueType}`);
    }
}

/**
 * Validation helper designed for `viewableBy` meta property. Checks is value equal
 * 1 of 3 options: `everybody`, `signed_in_users` or `staff`. If check failed, throws an error.
 * Otherwise does nothing
 *
 * @throws {Error} - throws exception if validation failed
 *
 * @param {any} value - value received from json
 */
function validateViewableBy(value) {
    validateOptionsValue(
        value,
        'string',
        ['everybody', 'signed_in_users', 'staff']
    );
}

/**
 * Validation helper designed for `manageableBy` meta property. Checks is value equals
 * `staff` or `mangers`. If check failed, throws an error.
 * Otherwise does nothing
 *
 * @throws {Error} - throws exception if validation failed
 *
 * @param {any} value - value received from json
 */
function validateManageableBy(value) {
    validateOptionsValue(
        value,
        'string',
        ['staff', 'managers']
    );
}

function validateOptionsValue(value, type, options) {
    checkType(value, type);

    if (!_.includes(options, value)) {
        throw new Error(`Value must be ${options.join(' or ')}`);
    }
}

function validateLabels(value) {
    if (!Array.isArray(value) && typeof value !== 'string') {
        throw new Error('Value must be either Array or string!');
    }
}

module.exports = {
    shouldBeNumber,
    shouldBeString,
    shouldBeBoolean,
    validateViewableBy,
    validateManageableBy,
    validateLabels
};
