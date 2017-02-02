const Uploader = require('../../../lib/zendesk-uploader/uploader');
const zendesk = require('node-zendesk');

describe('Uploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        process.env.ZENDESK_API_USERNAME = 'username';
        process.env.ZENDESK_API_TOKEN = 'token';
        process.env.ZENDESK_URL = 'url';

        this.document = {
            type: 'type',
            meta: {
                title: 'Test Title',
                position: 42,
                locale: 'locale'
            },
            body: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>'
        };
    });
    afterEach(() => {
        sandbox.restore();
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
        delete this.document;
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            const zendeskClient = sinon.stub().returns({});
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new Uploader({meta: {}}, zendeskClient);
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.not.have.been.called;
        });
    });

    describe('upload', () => {
        it('should return a promise on success', () => {
            let uploader = new Uploader(this.document);
            return expect(uploader.upload()).to.be.fulfilled;
        });

        it('should reject with an error if title is not defined', () => {
            delete this.document.meta.title;
            const uploader = new Uploader(this.document);
            return expect(uploader.upload()).to.be.rejectedWith(/`title` is missing from the metadata/);
        });
    });
});
