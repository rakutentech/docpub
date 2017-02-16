const MarkdownIt = require('markdown-it');
const pluginHelper = require('../../../lib/md-renderer/plugin-helper');

describe('PluginHelper', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('replaceAttributeValue', () => {
        it('should add the specified rule', () => {
            const markdownIt = new MarkdownIt();

            markdownIt.use((md) => {
                pluginHelper.replaceAttributeValue({
                    rule: 'randomRule',
                    attribute: 'attr',
                    transformer: sandbox.stub(),
                    markdownIt: md
                });
            });

            markdownIt.render('Test');

            expect(markdownIt.renderer.rules.randomRule)
                .to.exist;
        });

        it('should pass the value of specified rules attribute to the transformer function', () => {
            const markdownIt = new MarkdownIt();
            const testFunction = sandbox.stub();

            markdownIt.use((md) => {
                pluginHelper.replaceAttributeValue({
                    rule: 'link_open',
                    attribute: 'href',
                    transformer: testFunction,
                    markdownIt: md
                });
            });

            markdownIt.render('[Test](test)');

            expect(testFunction)
                .to.have.been.calledWith('test');
        });

        it('should replace the attribute value with the value returned by transformer', () => {
            const markdownIt = new MarkdownIt();

            markdownIt.use((md) => {
                pluginHelper.replaceAttributeValue({
                    rule: 'link_open',
                    attribute: 'href',
                    transformer: sandbox.stub().returns('transformer value'),
                    markdownIt: md
                });
            });

            markdownIt.render('[Test](test)');

            expect(markdownIt.render('[Test](test)'))
                .to.contain('href="transformer value"');
        });

        it('should also apply the previous method for the rule if it exists', () => {
            const markdownIt = new MarkdownIt();
            const testFunction = sandbox.stub();
            markdownIt.renderer.rules['link_open'] = testFunction;

            markdownIt.use((md) => {
                pluginHelper.replaceAttributeValue({
                    rule: 'link_open',
                    attribute: 'href',
                    transformer: sandbox.stub(),
                    markdownIt: md
                });
            });

            markdownIt.render('[Test](test)');

            expect(testFunction)
                .to.have.been.called;
        });

        it('should add the attribute if it doesnt exist on the token', () => {
            const markdownIt = new MarkdownIt();

            markdownIt.use((md) => {
                pluginHelper.replaceAttributeValue({
                    rule: 'link_open',
                    attribute: 'randomAttr',
                    transformer: sandbox.stub().returns('test'),
                    markdownIt: md
                });
            });

            markdownIt.render('[Test](test)');

            expect(markdownIt.render('[Test](test)'))
                .to.contain('randomAttr="test"');
        });

        it('should throw an error if the transformer is not a function', () => {
            const markdownIt = new MarkdownIt();

            markdownIt.use((md) => {
                expect(()=> {
                    pluginHelper.replaceAttributeValue({
                        rule: 'link_open',
                        attribute: 'href',
                        markdownIt: md
                    });
                }).to.throw(/Transformer/);
            });
        });
    });

    describe('isRelativePath', () => {
        it('should return true if the path is relative', () => {
            const path = 'testDir/test/file.html';

            expect(pluginHelper.isRelativePath(path))
                .to.be.true;
        });

        it('should return true if the path is relative beginning with ".." operator', () => {
            const path = '../../test/test.html';

            expect(pluginHelper.isRelativePath(path))
                .to.be.true;
        });

        it('should return false if the path begins with "http://"', () => {
            const path = 'http://testDir/test/file.html';

            expect(pluginHelper.isRelativePath(path))
                .to.be.false;
        });

        it('should return false if the path begins with "https://"', () => {
            const path = 'https://testDir/test/file.html';

            expect(pluginHelper.isRelativePath(path))
                .to.be.false;
        });

        it('should return false if the path begins with "/"', () => {
            const path = '/testDir/test/file.html';

            expect(pluginHelper.isRelativePath(path))
                .to.be.false;
        });

        it('should return false if the path begins with "#"', () => {
            const path = '#Anchor';

            expect(pluginHelper.isRelativePath(path))
                .to.be.false;
        });
    });
});
