const zendesk = require('node-zendesk');
const ZendeskClientWrapper = require('../../../lib/zendesk-uploader/client-wrapper');

describe('ZendeskClientWrapper', () => {
    const sandbox = sinon.sandbox.create();
    before(() => {
        this.zendeskStub = zendesk.createClient({
            username: 'username',
            token: 'token',
            remoteUri: 'uri',
            helpcenter: true,
            disableGlobalState: true
        });
    });
    beforeEach(() => {
        this.zendeskClient = new ZendeskClientWrapper(this.zendeskStub);
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should wrap the methods of the client.article object', () => {
            let stub = sandbox.stub(this.zendeskStub.articles, 'create')
                .yields(null, null, {});

            return this.zendeskClient.articles.create(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.sections object', () => {
            let stub = sandbox.stub(this.zendeskStub.sections, 'create')
                .yields(null, null, {});

            return this.zendeskClient.sections.create(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.accesspolicies object', () => {
            let stub = sandbox.stub(this.zendeskStub.accesspolicies, 'update')
                .yields(null, null, {});

            return this.zendeskClient.accesspolicies.update(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.categories object', () => {
            let stub = sandbox.stub(this.zendeskStub.categories, 'create')
                .yields(null, null, {});

            return this.zendeskClient.categories.create(123)
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });
    });

    describe('{property}.{method}', () => {
        it('should fulfill a promise with the result on success', () => {
            sandbox.stub(this.zendeskStub.articles, 'create')
                .yields(null, null, {result: 'result'});

            return expect(this.zendeskClient.articles.create(123, {test: 'test'}))
                .to.eventually.become({result: 'result'});
        });

        it('should reject a promise with the error on error', () => {
            sandbox.stub(this.zendeskStub.articles, 'create')
                .yields({error: 'error'});

            return expect(this.zendeskClient.articles.create(123, {test: 'test'}))
                .to.be.rejectedWith({error: 'error'});
        });

        it('should pass all parameters to the wrapped method', () => {
            let stub = sandbox.stub(this.zendeskStub.articles, 'create')
                .yields(null, null, {});

            return this.zendeskClient.articles.create(123, {test: 'test'})
                .then(() => {
                    expect(stub)
                        .to.have.been.calledWith(123, {test: 'test'});
                });
        });

        it('should retry after the specified time in seconds if `retryAfter` is present in the error', () => {
            const retryTime = 0.1;
            const stub = sandbox.stub(this.zendeskStub.articles, 'create');
            stub.onFirstCall().yields({retryAfter: retryTime});
            stub.onSecondCall().yields(null, null, {});

            let clock = sandbox.useFakeTimers();
            let createArticle = this.zendeskClient.articles.create(123, {});

            expect(stub).to.have.been.calledOnce;

            clock.tick(retryTime * 1000);
            return createArticle.then(() => {
                expect(stub).to.have.been.calledTwice;
            });
        });

        it('should retry after 500ms if a 500 error is returned without a `retryAfter` property', () => {
            const stub = sandbox.stub(this.zendeskStub.articles, 'create');
            stub.onFirstCall().yields({statusCode: 503});
            stub.onSecondCall().yields(null, null, {});

            let clock = sandbox.useFakeTimers();
            let createArticle = this.zendeskClient.articles.create(123, {});

            expect(stub).to.have.been.calledOnce;

            clock.tick(500);
            return createArticle.then(() => {
                expect(stub).to.have.been.calledTwice;
            });
        });

        it('should reject the promise if the request fails after 5 retries', () => {
            const stub = sandbox.stub(this.zendeskStub.articles, 'create')
                .yields({retryAfter: 0.01});

            return expect(this.zendeskClient.articles.create(123, {test: 'test'}))
                .to.be.rejected.then(() => {
                    expect(stub.callCount).to.be.equal(6);
                });
        });
    });
});
