'use strict';

require('any-promise/register/bluebird'); // Registering bluebird as default promises
require('mock-fs'); //make sure it's called before tests

const chai = require('chai');
const Promise = require('bluebird');

Promise.config({
    longStackTraces: true
});

global.sinon = require('sinon');
global.expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
sinon.assert.expose(chai.expect, {prefix: ''});
