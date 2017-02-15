const _ = require('lodash');

/**
 * Defines getters from source on recepient object.
 * All keys from source, will be defined on recepient.
 * Defined getters are enumerable and configurable, but not writeable
 *
 * @param  {object} recepient - object on which getters will be populated
 * @param  {object} source - object from which values will be taken
 */
function defineGetters(recepient, source) {
    _.keys(source).forEach(key => {
        defineGetter(recepient, key, source[key]);
    });
}

function defineGetter(recepient, key, value) {
    if (typeof key !== 'string' || !key.length) {
        return;
    }

    Object.defineProperty(recepient, key, {
        enumerable: true,
        configurable: true,
        writeable: false,
        get: () => value
    });
}

module.exports = {
    defineGetters
};
