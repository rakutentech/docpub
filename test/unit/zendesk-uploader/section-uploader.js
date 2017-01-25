const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const zendesk = require('node-zendesk');

describe('SectionUploader', () => {
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

        this.section = {
            meta: {
                id: 206096068,
                title: 'Test Section',
                locale: 'section-locale'
            },
            category: {
                meta: {
                    id: 123456
                }
            },
            articles: []
        };
        this.article1 = {
            section: this.section,
            meta: {
                title: 'Test Article',
                position: 42,
                locale: 'locale',
                labels: ['test', 'test2', 'test3']
            },
            html: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>'
        };
        this.article1.convertMarkdown = sinon.stub().returns(Promise.resolve());
        this.article2 = {
            section: this.section,
            meta: {
                title: 'Test Article 1',
                position: 40,
                locale: 'locale',
                labels: ['label', 'label2', 'label3']
            },
            html: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>'
        };
        this.article2.convertMarkdown = sinon.stub().returns(Promise.resolve());
        this.section.articles.push(this.article1, this.article2);

        this.sectionResponse = {
            id: 206096068,
            position: 2,
            locale: 'section-locale'
        };

        this.articleResponse = {
            id: 37486578,
            promoted: false,
            position: 42,
            'section_id': 206096068
        };

        this.requestMatcher = {
            section: {
                name: sinon.match.any,
                locale: sinon.match.any
            }
        };
    });
    afterEach(() => {
        sandbox.restore();
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
        delete process.env.ZENDESK_API_LOCALE;
        delete this.section;
        delete this.sectionResponse;
        delete this.articleResponse;
        delete this.requestMatcher;
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            let zendeskClient = sinon.stub().returns({});
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new SectionUploader(this.section, zendeskClient);
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.not.have.been.called;
        });

        it('should throw an error if Zendesk Username is not defined', () => {
            delete process.env.ZENDESK_API_USERNAME;
            expect(() => new SectionUploader(this.section)).to.throw(/Environment variable for Zendesk Username is undefined/);
        });

        it('should throw an error if Zendesk Token is not defined', () => {
            delete process.env.ZENDESK_API_TOKEN;
            expect(() => new SectionUploader(this.section)).to.throw(/Environment variable for Zendesk Token is undefined/);
        });

        it('should throw an error if Zendesk API Url is not defined', () => {
            delete process.env.ZENDESK_URL;
            expect(() => new SectionUploader(this.section)).to.throw(/Environment variable for Zendesk Url is undefined/);
        });

        it('should remove trailing slashes from the provided zendesk URI', () => {
            process.env.ZENDESK_URL = 'http://www.url.com//';
            sandbox.spy(zendesk, 'createClient');
            /*eslint-disable no-new*/
            new SectionUploader(this.section);
            /*eslint-enable no-new*/
            expect(zendesk.createClient).to.have.been.calledWith(
                sinon.match({remoteUri: 'http://www.url.com/api/v2/help_center'})
            );
        });
    });

    describe('upload', () => {
        it('should reject with an error if title is not defined', () => {
            delete this.section.meta.title;
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, {});
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(/`title` is missing from the metadata/);
        });

        it('should reject with an error if category id is not defined', () => {
            delete this.section.category.meta.id;
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, {});
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(/`id` is missing from this sections category metadata/);
        });

        it('should reject the promise when the create sections API returns an error', () => {
            let error = {
                error: 'error message'
            };
            sandbox.stub(this.zendeskClient.sections, 'create').yields(error);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            this.section.meta.locale = 'locale';
            this.requestMatcher.section.locale = 'locale';
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            delete this.section.meta.locale;
            process.env.ZENDESK_API_LOCALE = 'test-locale';
            this.requestMatcher.section.locale = 'test-locale';
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            delete this.section.meta.locale;
            this.requestMatcher.section.locale = 'en-us';
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the section `position` to the request if one is provided', () => {
            this.section.meta.position = 42;
            this.requestMatcher.section.position = 42;
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should set the section description to the request if one is provided', () => {
            this.section.meta.description = 'Section description goes here';
            this.requestMatcher.section.description = 'Section description goes here';
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledWith(
                        sinon.match.any,
                        this.requestMatcher,
                        sinon.match.any
                    );
                });
        });

        it('should return the updated section metadata on success', () => {
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return expect(uploader.upload()).to.eventually.have.become({
                title: 'Test Section',
                position: 2,
                locale: 'section-locale',
                id: 206096068
            });
        });

        it('should set the returned section id to the meta property', () => {
            this.sectionResponse.id = 9834895;
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then((meta) => {
                    expect(meta.id).to.be.eql(9834895);
                });
        });

        it('should set the returned section position to the meta property', () => {
            this.sectionResponse.position = 454;
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then((meta) => {
                    expect(meta.position).to.be.eql(454);
                });
        });

        it('should upload each article passed in the `articles` array', () => {
            this.section.articles = [this.article1, this.article2];
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.have.been.calledTwice;
                });
        });

        it('should not upload any articles if no articles were provided', () => {
            this.section.articles = [];
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, this.articleResponse);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create).to.not.have.been.called;
                });
        });

        it('should reject with an error if an article upload returns an error', () => {
            const error = {error: 'error'};
            sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, this.sectionResponse);
            sandbox.stub(this.zendeskClient.articles, 'create').yields(error);
            const uploader = new SectionUploader(this.section, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(error);
        });
    });
});

