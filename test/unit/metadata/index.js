const mockFs = require('mock-fs');
const metadata = require('../../../lib/metadata');
const Metadata = require('../../../lib/metadata/metadata');

describe('metadata builders', () => {
    afterEach(() => {
        mockFs.restore();
    });

    describe('buildForCategory', () => {
        it('should return metadata object', () => {
            expect(metadata.buildForCategory('path')).to.be.instanceOf(Metadata);
        });

        describe('user meta scheme configuration', () => {
            testCommonUserPropertiesFor_('Category');

            it('should configure scheme to have `description` property', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","description":"my_description"}'}
                });

                const meta = metadata.buildForCategory('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('description', 'my_description');
                    });
            });

            it('should configure scheme to check is `description` a string', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","description":0}'}
                });

                const meta = metadata.buildForCategory('dir');

                return expect(meta.read())
                    .to.be.rejectedWith(/string/);
            });

            it('should configure description to have empty string as default value', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title"}'}
                });

                const meta = metadata.buildForCategory('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('description', '');
                    });
            });
        });

        describe('system meta scheme configuration', () => {
            testCommonSystemPropertiesFor_('Category');
        });
    });

    describe('buildForSection', () => {
        it('should return metadata object', () => {
            expect(metadata.buildForSection('path')).to.be.instanceOf(Metadata);
        });

        describe('user meta scheme configuration', () => {
            testCommonUserPropertiesFor_('Section');

            it('should configure scheme to have `description` property', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","description":"my_description"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('description', 'my_description');
                    });
            });

            it('should configure scheme to check is `description` a string', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","description":0}'}
                });

                const meta = metadata.buildForSection('dir');

                return expect(meta.read())
                    .to.be.rejectedWith(/string/);
            });

            it('should configure description to have empty string as default value', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('description', '');
                    });
            });

            it('should configure scheme to have `viewableBy` property', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","viewableBy":"signed_in_users"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('viewableBy', 'signed_in_users');
                    });
            });

            it('should configure scheme to check is `viewableBy` a string', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","viewableBy":0}'}
                });

                const meta = metadata.buildForSection('dir');

                return expect(meta.read())
                    .to.be.rejectedWith(/string/);
            });

            it('should configure `viewableBy` to have `everybody` va as default value', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('viewableBy', 'everybody');
                    });
            });

            it('should configure scheme to have `manageableBy` property', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","manageableBy":"managers"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('manageableBy', 'managers');
                    });
            });

            it('should configure scheme to check is `manageableBy` a string', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","manageableBy":0}'}
                });

                const meta = metadata.buildForSection('dir');

                return expect(meta.read())
                    .to.be.rejectedWith(/string/);
            });

            it('should configure `manageableBy` to have `staff` va as default value', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title"}'}
                });

                const meta = metadata.buildForSection('dir');

                return meta.read()
                    .then(() => {
                        expect(meta).to.have.property('manageableBy', 'staff');
                    });
            });
        });

        describe('system meta scheme configuration', () => {
            testCommonSystemPropertiesFor_('Section');
        });
    });

    describe('buildForArticle', () => {
        it('should return metadata object', () => {
            expect(metadata.buildForArticle('path')).to.be.instanceOf(Metadata);
        });

        describe('user meta scheme configuration', () => {
            testCommonUserPropertiesFor_('Article');

            it('should configure scheme to have `labels` property', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","labels":"label"}'}
                });

                const meta = metadata.buildForArticle('dir');

                return meta.read()
                    .then(() => {
                        expect(meta.labels).to.be.eql(['label']);
                    });
            });

            it('should configure scheme to check is `labels` a string or Array', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","labels":0}'}
                });

                const meta = metadata.buildForArticle('dir');

                return expect(meta.read())
                    .to.be.rejectedWith(/Array or string/);
            });

            it('should configure labels to be an empty array by default', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title"}'}
                });

                const meta = metadata.buildForArticle('dir');

                return meta.read()
                    .then(() => {
                        expect(meta.labels).to.be.eql([]);
                    });
            });

            it('should map comma-separated string of labels to array of labels', () => {
                mockFs({
                    dir: {'meta.json': '{"title":"my_title","labels":"foo,bar,baz"}'}
                });

                const meta = metadata.buildForArticle('dir');

                return meta.read()
                    .then(() => {
                        expect(meta.labels).to.be.eql(['foo', 'bar', 'baz']);
                    });
            });
        });

        describe('system meta scheme configuration', () => {
            testCommonSystemPropertiesFor_('Article');

            it('should configure scheme to have `resources` property', () => {
                mockFs({
                    dir: {
                        'meta.json': '{"title":"my_title"}',
                        '.meta.json': '{"resources":{"foo":"bar"}}'
                    }
                });

                const meta = metadata.buildForArticle('dir');

                return meta.read()
                    .then(() => {
                        expect(meta.resources).to.be.eql({foo: 'bar'});
                    });
            });

            it('should configure scheme to set `resouces` default value as empty object', () => {
                mockFs({
                    dir: {
                        'meta.json': '{"title":"my_title"}',
                        '.meta.json': '{}'
                    }
                });

                const meta = metadata.buildForArticle('dir');

                return meta.read()
                    .then(() => {
                        expect(meta.resources).to.be.eql({});
                    });
            });
        });
    });

    function testCommonUserPropertiesFor_(entityName) {
        const methodName = `buildFor${entityName}`;

        it('should configure scheme to have `title` property', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title"}'}
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('title', 'my_title');
                });
        });

        it('should configure title to be required property', () => {
            mockFs({
                dir: {'meta.json': '{"locale":"en-us"}'}
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read())
                .to.be.rejectedWith(/title/);
        });

        it('should configure scheme to check is `title` a string', () => {
            mockFs({
                dir: {'meta.json': '{"title":0}'}
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read())
                .to.be.rejectedWith(/string/);
        });

        it('should configure sheme to have `locale` property', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title","locale":"en-us"}'}
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('locale', 'en-us');
                });
        });

        it('should configure scheme to check is a string', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title","locale":1}'}
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read())
                .to.be.rejectedWith(/string/);
        });

        it('should configure locale to be `en-us` by default', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title"}'}
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('locale', 'en-us');
                });
        });

        it('should configure scheme to have `position` property', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title","position":1}'}
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('position', 1);
                });
        });

        it('should configure scheme to check is position a number', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title","position":"1"}'}
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read())
                .to.be.rejectedWith(/number/);
        });

        it('should configure position to be 0 by default', () => {
            mockFs({
                dir: {'meta.json': '{"title":"my_title"}'}
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('position', 0);
                });
        });
    }

    function testCommonSystemPropertiesFor_(entityName) {
        const methodName = `buildFor${entityName}`;
        it('should configure scheme to have `zendeskId` property', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{"zendeskId":123}'
                }
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('zendeskId', 123);
                });
        });

        it('should configure scheme to check is `zendeskId` a number', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{"zendeskId":"123"}'
                }
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read()).to.be.rejectedWith(/number/);
        });

        it('should configure scheme to set `zendeskId` default value as 0', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{}'
                }
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('zendeskId', 0);
                });
        });

        it('should configure scheme to have `hash` property', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{"hash":"abcdef"}'
                }
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('hash', 'abcdef');
                });
        });

        it('should configure scheme to check is `hash` a string', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{"hash":123}'
                }
            });

            const meta = metadata[methodName]('dir');

            return expect(meta.read()).to.be.rejectedWith(/string/);
        });

        it('should configure scheme to set `hash` default value as empty string', () => {
            mockFs({
                dir: {
                    'meta.json': '{"title":"my_title"}',
                    '.meta.json': '{}'
                }
            });

            const meta = metadata[methodName]('dir');

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('hash', '');
                });
        });
    }
});
