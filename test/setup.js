'use strict';

const chai = require('chai');
const Promise = require('bluebird');

Promise.config({
    longStackTraces: true
});

global.sinon = require('sinon');
global.expect = chai.expect;

chai.use(require('chai-as-promised'));
sinon.assert.expose(chai.expect, {prefix: ''});
