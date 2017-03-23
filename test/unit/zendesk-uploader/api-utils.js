const zendesk = require('node-zendesk');
const proxyquire = require('proxyquire');

const createDummyConfig = require('./test-utils').createDummyConfig;

let apiUtils;

describe('api-utils', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        apiUtils = proxyquire('../../../lib/zendesk-uploader/api-utils', {
            './client-wrapper': sandbox.stub()
        });

        sandbox.stub(zendesk, 'createClient');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getClient', () => {
        it('should throw if config is missing', () => {
            expect(() => apiUtils.getClient()).to.throw(/config/);
        });

        it('should create an instance of the zendesk API client', () => {
            apiUtils.getClient(createDummyConfig());

            expect(zendesk.createClient).to.have.been.called;
        });

        it('should pass client username', () => {
            const config = createDummyConfig({
                username: 'foo'
            });

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.be.calledWithMatch({username: 'foo'});
        });

        it('should pass client token', () => {
            const config = createDummyConfig({token: 'foo'});

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.be.calledWithMatch({token: 'foo'});
        });

        it('should pass client URL adding helpcenter endpoint path', () => {
            const config = createDummyConfig({url: 'http://www.url.com'});

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.be.calledWithMatch({remoteUri: 'http://www.url.com/api/v2/help_center'});
        });

        it('should remove trailing slashes from the provided zendesk URI', () => {
            const config = createDummyConfig({url: 'http://www.url.com//'});

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.have.been.calledWithMatch({remoteUri: 'http://www.url.com/api/v2/help_center'});
        });

        it('should configure client to enable helpcenter', () => {
            const config = createDummyConfig();

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.be.calledWithMatch({helpcenter: true});
        });

        it('should configure client to run client as Library only - not scriptrunner', () => {
            const config = createDummyConfig();

            apiUtils.getClient(config);

            expect(zendesk.createClient)
                .to.be.calledWithMatch({disableGlobalState: true});
        });
    });
});
