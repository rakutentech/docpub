const Uploader = require('../../../lib/zendesk-uploader/uploader');
const apiUtils = require('../../../lib/zendesk-uploader/api-utils');

describe('Uploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        process.env.ZENDESK_API_USERNAME = 'username';
        process.env.ZENDESK_API_TOKEN = 'token';
        process.env.ZENDESK_URL = 'url';
    });
    afterEach(() => {
        sandbox.restore();
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            const zendeskClient = sinon.stub().returns({});
            sandbox.spy(apiUtils, 'getClient');
            /*eslint-disable no-new*/
            new Uploader({meta: {}}, zendeskClient);
            /*eslint-enable no-new*/

            expect(apiUtils.getClient)
                .to.not.have.been.called;
        });
    });

    describe('create', () => {
        it('should return a promise', () => {
            const document = {
                meta: {
                    title: 'Test Title'
                }
            };
            let uploader = new Uploader(document);

            return expect(uploader.create())
                .to.be.fulfilled;
        });
    });

    describe('sync', () => {
        it('should return true if the document has changed', () => {
            const document = {
                meta: {
                    title: 'Test Title',
                    zendeskId: 12345
                },
                isChanged: sinon.stub().resolves(true)
            };
            let uploader = new Uploader(document);

            return expect(uploader.sync())
                .to.become(true);
        });

        it('should return false if the document has not changed', () => {
            const document = {
                meta: {
                    title: 'Test Title',
                    zendeskId: 12345
                },
                isChanged: sinon.stub().resolves(false)
            };
            let uploader = new Uploader(document);

            return expect(uploader.sync())
                .to.become(false);
        });
    });
});
