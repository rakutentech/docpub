const MarkdownIt = require('markdown-it');
const Document = require('../../../lib/document');
const imageReplacer = require('../../../lib/md-renderer/image-replacer');

describe('ImageReplacer', () => {
    it('should replace relative image paths with a link to the Zendesk attachment', () => {
        const renderer = createRenderer_(123456);
        const markdown = '![alt text](../testDir/test/stuff.png "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="/hc/article_attachments/123456/stuff.png');
    });

    it('should replace image paths within the same directory with a link to the Zendesk attachment', () => {
        const renderer = createRenderer_(123456);
        const markdown = '![alt text](stuff.png "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="/hc/article_attachments/123456/stuff.png');
    });

    it('should not replace image paths that start with "http://"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '![alt text](http://testDir/test/stuff.png "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="http://testDir/test/stuff.png"');
    });

    it('should not replace image paths that start with "https://"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '![alt text](https://testDir/test/stuff.png "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="https://testDir/test/stuff.png"');
    });

    it('should not replace image paths that start with "/"', () => {
        const renderer = createRenderer_(123456);
        const markdown = '![alt text](/testDir/test/stuff.png "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="/testDir/test/stuff.png"');
    });

    it('should not replace the image src if findByPath returns `undefined`', () => {
        const document = new Document('path');
        const renderer = createRenderer_(123456, document);
        document.findByPath.returns(undefined);
        const markdown = '![alt text](../non-existent-path "Logo Text")';

        expect(renderer.render(markdown))
            .to.contain('src="../non-existent-path"');
    });

    it('should throw an error if no parameter is provided', () => {
        expect(() => new MarkdownIt().use(imageReplacer))
            .to.throw(/Document/);
    });

    it('should throw an error if the provided parameter is not an instance of Document', () => {
        const randomFunction = function() {};

        expect(() => new MarkdownIt().use(imageReplacer, randomFunction))
            .to.throw(/Document/);
    });
});

function createRenderer_(attachmentId, document) {
    document = document || new Document('path');
    document.findByPath = sinon.stub().returns(attachmentId);
    const renderer = new MarkdownIt()
        .use(imageReplacer, document);
    return renderer;
}
