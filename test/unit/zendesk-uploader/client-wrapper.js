const zendesk = require('node-zendesk');
const mockFs = require('mock-fs');
const request = require('request');
const _ = require('lodash');
const ZendeskClientWrapper = require('../../../lib/zendesk-uploader/client-wrapper');
const logger = require('../../../lib/logger');

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
            const stub = sandbox.stub(this.zendeskStub.articles, 'create')
                .yields(null, null, {});

            return this.zendeskClient.articles.create(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.articleattachments object', () => {
            const stub = sandbox.stub(this.zendeskStub.articleattachments, 'list')
                .yields(null, null, {});

            return this.zendeskClient.articleattachments.list(123)
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.sections object', () => {
            const stub = sandbox.stub(this.zendeskStub.sections, 'create')
                .yields(null, null, {});

            return this.zendeskClient.sections.create(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.accesspolicies object', () => {
            const stub = sandbox.stub(this.zendeskStub.accesspolicies, 'update')
                .yields(null, null, {});

            return this.zendeskClient.accesspolicies.update(123, {test: 'test'})
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.categories object', () => {
            const stub = sandbox.stub(this.zendeskStub.categories, 'create')
                .yields(null, null, {});

            return this.zendeskClient.categories.create(123)
                .then(() => {
                    expect(stub).to.have.been.called;
                });
        });

        it('should wrap the methods of the client.translations object', () => {
            const stub = sandbox.stub(this.zendeskStub.translations, 'show')
                .yields(null, null, {});

            return this.zendeskClient.translations.show()
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
            const stub = sandbox.stub(this.zendeskStub.articles, 'create')
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

        it('should retry after twice as long as the last retry for the request when there are subsequent 500 errors', () => {
            const stub = sandbox.stub(this.zendeskStub.articles, 'create');
            stub.yields(null, null, {});
            stub.onFirstCall().yields({statusCode: 503});
            stub.onSecondCall().yields({statusCode: 503});
            stub.onThirdCall().yields({statusCode: 503});

            let clock = sandbox.useFakeTimers();
            let createArticle = this.zendeskClient.articles.create(123, {});

            expect(stub).to.have.been.calledOnce;
            clock.tick(500);
            expect(stub).to.have.been.calledTwice;
            clock.tick(1000);
            expect(stub).to.have.been.calledThrice;
            clock.tick(2000);
            return createArticle.then(() => {
                expect(stub.callCount).to.be.equal(4);
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

        it('should log a warning when a request is retried', () => {
            const stub = sandbox.stub(this.zendeskStub.articles, 'create').yields(null, null, {});
            stub.onFirstCall().yields({retryAfter: 0.01});
            sandbox.stub(logger, 'warn');

            return this.zendeskClient.articles.create(123, {test: 'test'})
                .then(() => {
                    expect(logger.warn)
                        .to.have.been.calledWithMatch(/10 milliseconds/);
                });
        });
    });

    describe('articleattachments.create', () => {
        beforeEach(() => {
            sandbox.stub(request, 'post').yields(
                null,
                {statusCode: 200},
                JSON.stringify({'article_attachment': {}})
            );
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should fulfill a promise with the result on success', () => {
            mockFs({
                'test.jpg': 'content'
            });
            request.post.yields(
                null,
                {statusCode: 200},
                JSON.stringify({'article_attachment': {test: 'test'}})
            );

            return expect(this.zendeskClient.articleattachments.create(123, 'test.jpg'))
                .to.eventually.become({test: 'test'});
        });

        it('should set the request url to the article attachments endpoint for the correct article ID', () => {
            mockFs({
                'test.jpg': 'content'
            });

            return this.zendeskClient.articleattachments.create(123, 'test.jpg')
                .then(() => {
                    expect(request.post)
                        .to.have.been.calledWith(sinon.match({
                            url: 'uri/articles/123/attachments.json'
                        }));
                });
        });

        it('should attach the file to the request formData', () => {
            mockFs({
                'test.jpg': 'content'
            });

            return this.zendeskClient.articleattachments.create(123, 'test.jpg')
                .then(() => {
                    expect(request.post)
                        .to.have.been.calledWithMatch({formData: sinon.match({
                            file: sinon.match.object
                        })});
                });
        });

        it('should attach the file as inline', () => {
            mockFs({
                'test.jpg': 'content'
            });

            return this.zendeskClient.articleattachments.create(123, 'test.jpg')
                .then(() => {
                    expect(request.post)
                        .to.have.been.calledWithMatch({formData: sinon.match({
                            inline: 'true'
                        })});
                });
        });

        it('should reject the promise with an error when the request returns an error', () => {
            mockFs({
                'test.jpg': 'content'
            });
            request.post.yields({error: 'error'});

            return expect(this.zendeskClient.articleattachments.create(123, 'test.jpg'))
                .to.be.rejectedWith({error: 'error'});
        });

        it('should reject the promise when the request returns an error status code', () => {
            mockFs({
                'test.jpg': 'content'
            });
            request.post.yields(null, {statusCode: 400});

            return expect(this.zendeskClient.articleattachments.create(123, 'test.jpg'))
                .to.be.rejected;
        });

        it('should retry the request when the response contains a `retry-after` header', () => {
            mockFs({
                'test.jpg': 'content'
            });
            request.post.yields(
                null,
                {statusCode: 200},
                JSON.stringify({test: 'test'})
            );
            request.post.onFirstCall().yields(
                null,
                {headers: {'retry-after': .05}}
            );

            return this.zendeskClient.articleattachments.create(123, 'test.jpg')
                .then(() => {
                    expect(request.post)
                        .to.have.been.calledTwice;
                });
        });

        describe('authentication', () => {
            it('should set the request auth user to the zendesk client user', () => {
                const client = createZendeskClient_({
                    username: 'username',
                    password: 'password'
                });

                mockFs({
                    'test.jpg': 'content'
                });

                return client.articleattachments.create(123, 'test.jpg')
                    .then(() => {
                        expect(request.post)
                            .to.have.been.calledWithMatch({auth:
                                sinon.match({user: 'username'}
                            )});
                    });
            });

            it('should set the request password to the zendesk password if it exists', () => {
                const client = createZendeskClient_({
                    password: 'password'
                });

                mockFs({
                    'test.jpg': 'content'
                });

                return client.articleattachments.create(123, 'test.jpg')
                    .then(() => {
                        expect(request.post)
                            .to.have.been.calledWithMatch({auth:
                                sinon.match({pass: 'password'}
                            )});
                    });
            });

            it('should set the request password to the zendesk token if it exists', () => {
                const client = createZendeskClient_({
                    token: 'token'
                });
                mockFs({
                    'test.jpg': 'content'
                });

                return client.articleattachments.create(123, 'test.jpg')
                    .then(() => {
                        expect(request.post)
                            .to.have.been.calledWithMatch({auth:
                                sinon.match({pass: 'token'}
                            )});
                    });
            });

            it('should append `/token` to the request auth user is authenticating with an API token', () => {
                const client = createZendeskClient_({
                    token: 'token'
                });
                mockFs({
                    'test.jpg': 'content'
                });

                return client.articleattachments.create(123, 'test.jpg')
                    .then(() => {
                        expect(request.post)
                            .to.have.been.calledWithMatch({auth:
                                sinon.match({user: 'username/token'}
                            )});
                    });
            });

            it('should use Bearer authentication if `oauth` is set to true', () => {
                const client = createZendeskClient_({
                    oauth: true,
                    token: 'oauth-token'
                });
                mockFs({
                    'test.jpg': 'content'
                });

                return client.articleattachments.create(123, 'test.jpg')
                    .then(() => {
                        expect(request.post)
                            .to.have.been.calledWithMatch({auth:
                                sinon.match({bearer: 'oauth-token'}
                            )});
                    });
            });
        });
    });
});

function createZendeskClient_(opts) {
    return new ZendeskClientWrapper(
        zendesk.createClient(
            _.defaults(opts, {
                username: 'username',
                remoteUri: 'uri',
                helpcenter: true,
                disableGlobalState: true
            })
        )
    );
}
