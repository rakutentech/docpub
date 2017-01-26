const CategoryUploader = require('../../../lib/zendesk-uploader/category-uploader');
const zendesk = require('node-zendesk');
const _ = require('lodash');

describe('CategoryUploader', () => {
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

        this.categoryStub = sandbox.stub(this.zendeskClient.categories, 'create').yields(null, null, {id: 12345});
        this.sectionStub = sandbox.stub(this.zendeskClient.sections, 'create').yields(null, null, {id: 123456});
        this.articleStub = sandbox.stub(this.zendeskClient.articles, 'create').yields(null, null, {id: 123456});
    });
    afterEach(() => {
        sandbox.restore();
        delete process.env.ZENDESK_API_USERNAME;
        delete process.env.ZENDESK_API_TOKEN;
        delete process.env.ZENDESK_URL;
        delete process.env.ZENDESK_API_LOCALE;
    });

    describe('upload', () => {
        it('should create a category', () => {
            const category = createCategory_();
            const uploader = new CategoryUploader(category, this.zendeskClient);
            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.called;
                });
        });

        it('should reject with an error if title is not defined', () => {
            const category = createCategory_();
            delete category.meta.title;
            const uploader = new CategoryUploader(category, this.zendeskClient);
            return expect(uploader.upload()).to.be.rejectedWith(/`title` is missing from the metadata/);
        });

        it('should reject the promise when the create category API returns an error', () => {
            const category = createCategory_();
            let error = {
                error: 'error message'
            };
            this.categoryStub.yields(error);
            const uploader = new CategoryUploader(category, this.zendeskClient);
            
            return expect(uploader.upload()).to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const category = createCategory_({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.calledWith({
                        category: sinon.match({
                            locale: 'test-locale'
                        })
                    });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const category = createCategory_();
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.calledWith({
                        category: sinon.match({
                            locale: 'env-locale'
                        })
                    });
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const category = createCategory_();
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.calledWith({
                        category: sinon.match({
                            locale: 'en-us'
                        })
                    });
                });
        });

        it('should set the category `position` to the request if one is provided', () => {
            const category = createCategory_({
                meta: {
                    position: 42
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.calledWith({
                        category: sinon.match({
                            position: 42
                        })
                    });
                });
        });

        it('should set the category description to the request if one is provided', () => {
            const category = createCategory_({
                meta: {
                    description: 'Description goes here'
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create).to.have.been.calledWith({
                        category: sinon.match({
                            description: 'Description goes here'
                        })
                    });
                });
        });

        it('should return the updated category metadata on success', () => {
            const category = createCategory_({
                meta: {
                    title: 'Category Title',
                    locale: 'locale',
                    description: 'description'
                }
            });
            this.categoryStub.yields(null, null, {id: 123456, position: 42});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return expect(uploader.upload()).to.have.become({
                title: 'Category Title',
                id: 123456,
                locale: 'locale',
                position: 42,
                description: 'description'
            });
        });

        it('should set the returned category id to the meta property', () => {
            const category = createCategory_();
            const uploader = new CategoryUploader(category, this.zendeskClient);
            this.categoryStub.yields(null, null, {id: 98765});

            return uploader.upload()
                .then(() => {
                    expect(category.meta.id).to.be.eql(98765);
                });
        });

        it('should set the returned category position to the meta property', () => {
            const category = createCategory_();
            this.categoryStub.yields(null, null, {id: 123456, position: 42});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(category.meta.position).to.be.eql(42);
                });
        });

        it('should upload each section passed in the `sections` array', () => {
            const category = createCategory_();
            category.sections = [
                createSection_({category: category}),
                createSection_({category: category})
            ];
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.have.been.calledTwice;
                });
        });

        it('should not upload any sections if no sections were provided', () => {
            const category = createCategory_({sections: []});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create).to.not.have.been.called;
                });
        });

        it('should reject with an error if a section upload returns an error', () => {
            const category = createCategory_();
            const error = {error: 'error'};
            this.sectionStub.yields(error);
            const uploader = new CategoryUploader(category, this.zendeskClient);
            
            return expect(uploader.upload()).to.be.rejectedWith(error);
        });
    });
});

function createArticle_(opts) {
    opts = opts || {};
    const article = _.defaultsDeep(opts, {
        meta: {title: 'Test Article'},
        convertMarkdown: sinon.stub().returns(Promise.resolve('<p>Lorem ipsum dolor sit amet</p>'))
    });
    article.section = opts.section || createSection_({articles: article});

    return article;
}

function createSection_(opts) {
    opts = opts || {};
    const section = {
        meta: _.defaults(opts.meta || {}, {
            title: 'Test Section'
        })
    };
    section.articles = [].concat(opts.articles || [
        createArticle_({section: section}),
        createArticle_({section: section})
    ]);
    section.category = opts.category || createCategory_({sections: section});

    return section;
}

function createCategory_(opts) {
    opts = opts || {};
    const category = {
        meta: _.defaults(opts.meta || {}, {
            title: 'Test Category'
        })
    };
    category.sections = [].concat(opts.sections || [
        createSection_({category: category}),
        createSection_({category: category})
    ]);

    return category;
}
