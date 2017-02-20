const MarkdownIt = require('markdown-it');
const Document = require('../../../lib/document');
const linkReplacer = require('../../../lib/md-renderer/link-replacer');

describe('LinkReplacer', () => {
    it('should replace relative links with a link to the Zendesk article ID', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](../testDir/Test/article.md)';

        expect(renderer.render(markdown))
            .to.contain('href="/hc/articles/123456"');
    });

    it('should not replace links that start with "http://"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](http://testDir/Test/article.md)';

        expect(renderer.render(markdown))
            .to.contain('href="http://testDir/Test/article.md"');
    });

    it('should not replace links that start with "https://"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](https://testDir/Test/article.md)';

        expect(renderer.render(markdown))
            .to.contain('href="https://testDir/Test/article.md"');
    });

    it('should not replace links that start with "/"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](/testDir/Test/article.md)';

        expect(renderer.render(markdown))
            .to.contain('href="/testDir/Test/article.md"');
    });

    it('should not replace links that start with "#"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](#Anchor)';

        expect(renderer.render(markdown))
            .to.contain('href="#Anchor"');
    });

    it('should not replace links that start with "mailto:"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '[Link Text](mailto:test@test.com)';

        expect(renderer.render(markdown))
            .to.contain('href="mailto:test@test.com"');
    });

    it('should not replace the link if findByPath returns `undefined`', () => {
        const document = new Document('path');
        const renderer = createRenderer_(123456, document);
        document.findByPath.returns(undefined);
        const markdown = '[Link Text](../non-existent-path)';

        expect(renderer.render(markdown))
            .to.contain('href="../non-existent-path"');
    });

    it('should throw an error if no parameter is provided', () => {
        expect(() => new MarkdownIt().use(linkReplacer))
            .to.throw(/Document/);
    });

    it('should throw an error if the provided parameter is not an instance of Document', () => {
        const randomFunction = function() {};

        expect(() => new MarkdownIt().use(linkReplacer, randomFunction))
            .to.throw(/Document/);
    });
});

function createRenderer_(articleId, document) {
    document = document || new Document('path');
    document.findByPath = sinon.stub().returns(articleId);
    const renderer = new MarkdownIt()
        .use(linkReplacer, document);
    return renderer;
}
