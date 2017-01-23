const Uploader = require('../../../lib/zendesk-uploader/uploader');
const zendesk = require('node-zendesk');

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
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new Uploader({meta: {}}, zendeskClient);
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.not.have.been.called;
        });

        it('should throw an error if Zendesk Username is not defined', () => {
            delete process.env.ZENDESK_API_USERNAME;
            expect(() => new Uploader({meta: {}})).to.throw(/Environment variable for Zendesk Username is undefined/);
        });

        it('should throw an error if Zendesk Token is not defined', () => {
            delete process.env.ZENDESK_API_TOKEN;
            expect(() => new Uploader({meta: {}})).to.throw(/Environment variable for Zendesk Token is undefined/);
        });

        it('should throw an error if Zendesk API Url is not defined', () => {
            delete process.env.ZENDESK_URL;
            expect(() => new Uploader({meta: {}})).to.throw(/Environment variable for Zendesk Url is undefined/);
        });

        it('should remove trailing slashes from the provided zendesk URI', () => {
            process.env.ZENDESK_URL = 'http://www.url.com//';
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new Uploader({meta: {}});
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.have.been.calledWith({
                username: sinon.match.any,
                token: sinon.match.any,
                remoteUri: 'http://www.url.com/api/v2/help_center',
                helpcenter: sinon.match.any,
                disableGlobalState: sinon.match.any,
                type: sinon.match.any
            });
        });
    });

    describe('upload', () => {
        it('should return a promise on success', () => {
            const document = {
                type: 'type',
                meta: {
                    position: 42,
                    locale: 'locale'
                },
                body: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>'
            };
            let uploader = new Uploader(document);
            return expect(uploader.upload()).to.be.fulfilled;
        });
    });
});
