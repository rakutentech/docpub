const Promise = require('bluebird');
const Uploader = require('../../../lib/zendesk-uploader/uploader');
const apiUtils = require('../../../lib/zendesk-uploader/api-utils');

const createDummyConfig = require('./test-utils').createDummyConfig;

describe('Uploader', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if no document provided', () => {
            expect(() => new Uploader()).to.throw(/No document/);
        });

        it('should throw if no config provided', () => {
            expect(() => new Uploader({})).to.throw(/No config/);
        });

        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            const zendeskClient = sandbox.stub();
            sandbox.stub(apiUtils, 'getClient');

            /*eslint-disable no-new*/
            new Uploader(
                {meta: {}},
                createDummyConfig(),
                zendeskClient
             );
            /*eslint-enable no-new*/

            expect(apiUtils.getClient).to.be.not.called;
        });
    });

    describe('create', () => {
        it('should return a promise', () => {
            const document = {
                meta: {
                    title: 'Test Title'
                }
            };
            const uploader = createUploader_(document);

            return expect(uploader.create()).to.be.fulfilled;
        });
    });

    describe('sync', () => {
        it('should return a promise', () => {
            const document = {isChanged: true};

            const uploader = createUploader_(document);
            const result = uploader.sync();

            expect(result).to.be.instanceOf(Promise);
        });

        it('should return true if the document has changed', () => {
            const document = {isChanged: true};
            const uploader = createUploader_(document);

            return expect(uploader.sync())
                .to.become(true);
        });

        it('should return false if the document has not changed', () => {
            const document = {isChanged: false};
            const uploader = createUploader_(document);

            return expect(uploader.sync())
                .to.become(false);
        });
    });
});

function createUploader_(document) {
    const config = createDummyConfig();

    return new Uploader(document, config);
}
