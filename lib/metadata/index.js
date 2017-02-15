const Metadata = require('./metadata');
const Property = require('./parser').Property;
const Dictionary = require('./parser').Dictionary;

const ResourceMetadata = require('./resource-metadata');

const validationUtils = require('./validation-utils');
const mappingUtils = require('./mapping-utils');

const defaultUserProps = [
    new Property('title', {required: true, validate: validationUtils.shouldBeString}),
    new Property('locale', {validate: validationUtils.shouldBeString, defaultValue: 'en-us'}),
    new Property('position', {validate: validationUtils.shouldBeNumber, defaultValue: 0})
];

const defaultSystemProps = [
    new Property('zendeskId', {validate: validationUtils.shouldBeNumber, defaultValue: 0}),
    new Property('hash', {validate: validationUtils.shouldBeString, defaultValue: ''})
];

/**
 * Returns a Metadata object configured to parse Category metadata.
 * Configured user meta properties:
 * - title {string} (required)
 * - description {string}
 * - locale {string}
 * - position {number}
 * Configured system meta properties:
 * - zendeskId {number}
 * - hash {string}

 * @param  {string} path - path to Category metadata
 * @return {Metadata} - metadata instance configured for parsing Category metadata
 */
exports.buildForCategory = function(path) {
    const userProps = [
        ...defaultUserProps,
        new Property('description', {validate: validationUtils.shouldBeString, defaultValue: ''})
    ];
    const systemProps = defaultSystemProps;

    return new Metadata(
        path,
        Dictionary.createRoot(userProps),
        Dictionary.createRoot(systemProps)
    );
};

/**
 * Returns a Metadata object configured to parse Section metadata.
 * Configured user meta properties:
 * - title {string} (required)
 * - description {string}
 * - locale {string}
 * - position {number}
 * - viewableBy {string}
 * - manageableBy {string}
 * Configured system meta properties:
 * - zendeskId {number}
 * - hash {string}

 * @param  {string} path - path to Section metadata
 * @return {Metadata} - metadata instance configured for parsing Section metadata
 */
exports.buildForSection = function(path) {
    const userProps = [
        ...defaultUserProps,
        new Property('description', {validate: validationUtils.shouldBeString, defaultValue: ''}),
        new Property('viewableBy', {validate: validationUtils.validateViewableBy, defaultValue: 'everybody'}),
        new Property('manageableBy', {validate: validationUtils.validateManageableBy, defaultValue: 'staff'})
    ];
    const systemProps = defaultSystemProps;

    return new Metadata(
        path,
        Dictionary.createRoot(userProps),
        Dictionary.createRoot(systemProps)
    );
};

/**
 * Returns a Metadata object configured to parse Article metadata.
 * Configured user meta properties:
 * - title {string} (required)
 * - locale {string}
 * - position {number}
 * - labels {string|string[]}
 * Configured system meta properties:
 * - zendeskId {number}
 * - hash {string}
 * - resources {object}

 * @param  {string} path - path to Article metadata
 * @return {Metadata} - metadata instance configured for parsing Article metadata
 */
exports.buildForArticle = function(path) {
    const userProps = [
        ...defaultUserProps,
        new Property('labels', {validate: validationUtils.validateLabels, map: mappingUtils.mapLabels, defaultValue: []})
    ];
    const systemProps = [
        ...defaultSystemProps,
        new Property('resources', {defaultValue: {}})
    ];

    return new Metadata(
        path,
        Dictionary.createRoot(userProps),
        Dictionary.createRoot(systemProps)
    );
};

/**
 * Returns a ResourceMetadata object, which is representing resource metadata.
 * Needs a reference to Article's metadata to work. @see {@link ResourceMetadata}
 * @param  {string} path - path to the resource
 * @param  {Metadata} articleMeta - reference to Metadata of article owning this resource
 * @return {ResourceMetadata} - instance of ResourceMetadata.
 */
exports.buildForResource = function(path, articleMeta) {
    return new ResourceMetadata(path, articleMeta);
};
