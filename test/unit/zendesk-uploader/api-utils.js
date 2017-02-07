const zendesk = require('node-zendesk');
var proxyquire = require('proxyquire');
let apiUtils;

describe('api-utils', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        let ZendeskClientWrapper = sinon.stub();
        apiUtils = proxyquire('../../../lib/zendesk-uploader/api-utils', {
            './client-wrapper': ZendeskClientWrapper
        });
        sandbox.stub(zendesk, 'createClient');
        process.env.ZENDESK_API_USERNAME = 'username';
        process.env.ZENDESK_API_TOKEN = 'token';
        process.env.ZENDESK_URL = 'url';
    });
    afterEach(() => {
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
        sandbox.restore();
    });
    describe('getClient', () => {
        it('should create an instance of the zendesk API client', () => {
            apiUtils.getClient();
            expect(zendesk.createClient).to.have.been.called;
        });

        it('should remove trailing slashes from the provided zendesk URI', () => {
            process.env.ZENDESK_URL = 'http://www.url.com//';
            apiUtils.getClient();
            expect(zendesk.createClient)
                .to.have.been.calledWithMatch({remoteUri: 'http://www.url.com/api/v2/help_center'});
        });

        it('should throw an error if Zendesk Username is not defined', () => {
            delete process.env.ZENDESK_API_USERNAME;
            expect(() => apiUtils.getClient()).to.throw(/Username is undefined/);
        });

        it('should throw an error if Zendesk Token is not defined', () => {
            delete process.env.ZENDESK_API_TOKEN;
            expect(() => apiUtils.getClient()).to.throw(/Token is undefined/);
        });

        it('should throw an error if Zendesk API Url is not defined', () => {
            delete process.env.ZENDESK_URL;
            expect(() => apiUtils.getClient()).to.throw(/Url is undefined/);
        });
    });
});
