const Property = require('./property');
const Dictionary = require('./dictionary');

/**
 * Collection of this classes must be used to describe the predefined JSON structures.
 * Each key in JSON can be marked as required.
 * Each value in JSON may be validated in any way (possibility to specify validation function)
 * Each value in JSON may be mapped in any way (possibility to specify mapping function)
 * To describe the root or object property in JSON, use {@link Dictionary}
 * To describe single property, use {@link Property}
 */
module.exports = {
    Property,
    Dictionary
};
