const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const zendesk = require('node-zendesk');

describe('ArticleUploader', () => {
    const sandbox = sinon.sandbox.create();
    before(() => {
        this.zendeskClient = zendesk.createClient({
            username: 'username',
            token: 'token',
            remoteUri: 'uri',
            helpcenter: true,
            disableGlobalState: true
        });
    });
    beforeEach(() => {
        process.env.ZENDESK_API_USERNAME = 'username';
        process.env.ZENDESK_API_TOKEN = 'token';
        process.env.ZENDESK_URL = 'url';

        this.article = {
            section: {
                meta: {
                    id: 206096068
                }
            },
            meta: {
                title: 'Test Article',
                position: 42,
                locale: 'locale',
                labels: ['test', 'test2', 'test3']
            },
            html: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>'
        };

        this.response = {
            id: 37486578,
            'author_id': 3465,
            promoted: false,
            position: 42,
            'comments_disabled': true,
            'section_id': 206096068
        };
        this.requestMatcher = {
            article: {
                title: sinon.match.any,
                position: sinon.match.any,
                locale: sinon.match.any,
                'label_names': sinon.match.any,
                body: sinon.match.any
            }
        };
    });
    afterEach(() => {
        sandbox.restore();
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
        delete process.env.ZENDESK_API_LOCALE;
        delete this.article;
        delete this.response;
        delete this.requestMatcher;
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            let zendeskClient = sinon.stub().returns({});
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new ArticleUploader(this.article, zendeskClient);
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.not.have.been.called;
        });

        it('should throw an error if Zendesk Username is not defined', () => {
            delete process.env.ZENDESK_API_USERNAME;
            expect(() => new ArticleUploader(this.article)).to.throw(/Environment variable for Zendesk Username is undefined/);
        });

        it('should throw an error if Zendesk Token is not defined', () => {
            delete process.env.ZENDESK_API_TOKEN;
            expect(() => new ArticleUploader(this.article)).to.throw(/Environment variable for Zendesk Token is undefined/);
        });

        it('should throw an error if Zendesk API Url is not defined', () => {
            delete process.env.ZENDESK_URL;
            expect(() => new ArticleUploader(this.article)).to.throw(/Environment variable for Zendesk Url is undefined/);
        });

        it('should remove trailing slashes from the provided zendesk URI', () => {
            process.env.ZENDESK_URL = 'http://www.url.com//';
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new ArticleUploader(this.article);
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
        it('should reject with an error if title is not defined', () => {
            delete this.article.meta.title;
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, {});
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(/`title` is missing from the metadata/);
        });

        it('should reject with an error if section id is not defined', () => {
            delete this.article.section.meta.id;
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(/`id` is missing from this articles section metadata/);
        });

        it('should upload an article and return the updated article metadata on success', () => {
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return expect(uploader.upload()).to.eventually.have.become({
                title: 'Test Article',
                position: 42,
                locale: 'locale',
                labels: ['test', 'test2', 'test3'],
                id: 37486578
            });
        });

        it('should reject the promise when the api returns an error', () => {
            let error = {
                error: 'error message'
            };
            sandbox.stub(this.zendeskClient.articles, 'create').yields(error);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            this.article.meta.locale = 'locale';
            this.requestMatcher.article.locale = 'locale';
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            delete this.article.meta.locale;
            process.env.ZENDESK_API_LOCALE = 'test-locale';
            this.requestMatcher.article.locale = 'test-locale';
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            delete this.article.meta.locale;
            this.requestMatcher.article.locale = 'en-us';
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the `position` to the request if one is provided', () => {
            this.article.meta.position = 42;
            this.requestMatcher.article.position = 42;
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, {});
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should not set the `label_names` request property if no labels are provided', () => {
            delete this.article.meta.labels;
            delete this.requestMatcher.article.label_names;
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should convert a string of comma seperated labels to an array', () => {
            this.article.meta.labels = 'label1, label2, label3';
            this.requestMatcher.article['label_names'] = ['label1', 'label2', 'label3'];
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the returned article id to the meta property', () => {
            this.response.id = 9834895;
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then((meta) => {
                    expect(meta.id).to.be.eql(9834895);
                });
        });

        it('should set the returned article position to the meta property', () => {
            this.response.position = 454;
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.response);
            const uploader = new ArticleUploader(this.article, this.zendeskClient);
            return uploader.upload()
                .then((meta) => {
                    expect(meta.position).to.be.eql(454);
                });
        });
    });
});
