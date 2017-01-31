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

    describe('setSectionAccessPolicy', () => {
        beforeEach(() => {
            this.policy = {
                viewableBy: 'staff'
            };
            this.response = {
                'access_policy': {
                    'viewable_by': 'staff'
                }
            };
            this.zendeskClient.accesspolicies = {
                update: sandbox.stub().yields(null, null, this.response)
            };
        });
        afterEach(() => {
            delete this.policy;
            delete this.response;
        });
        it('should fulfill a promise and return the updated access policy on successful update', () => {
            const params = {
                sectionId: 123,
                meta: this.policy
            };

            return expect(apiUtils.setSectionAccessPolicy(params, this.zendeskClient))
                .to.have.become(this.response);
        });

        it('should reject the promise with an error if the api returns an error', () => {
            const error = {error: 'error'};
            const params = {
                sectionId: 123,
                meta: this.policy
            };
            this.zendeskClient.accesspolicies.update.yields(error);

            return expect(apiUtils.setSectionAccessPolicy(params, this.zendeskClient))
                .to.be.rejectedWith(error);
        });

        it('should fulfill a promise and return nothing if the metadata has no access policy', () => {
            const params = {
                sectionId: 123,
                meta: {}
            };

            return expect(apiUtils.setSectionAccessPolicy(params, this.zendeskClient))
                .to.become();
        });

        it('should set the `viewable_by` property to the request if it was available', () => {
            this.policy.viewableBy = 'everyone';
            const params = {
                sectionId: 123,
                meta: this.policy
            };

            return apiUtils.setSectionAccessPolicy(params, this.zendeskClient)
                .then(() => {
                    expect(this.zendeskClient.accesspolicies.update)
                        .to.have.been.calledWithMatch(sinon.match.any, {
                            'access_policy': {
                                'viewable_by': 'everyone'
                            }
                        });
                });
        });

        it('should set the `manageable_by` property to the request if it was available', () => {
            this.policy.manageableBy = 'everyone';
            const params = {
                sectionId: 123,
                meta: this.policy
            };

            return apiUtils.setSectionAccessPolicy(params, this.zendeskClient)
                .then(() => {
                    expect(this.zendeskClient.accesspolicies.update)
                        .to.have.been.calledWithMatch(sinon.match.any, {
                            'access_policy': {
                                'manageable_by': 'everyone'
                            }
                        });
                });
        });
    });
});
