const MarkdownRenderer = require('../../../lib/md-renderer');
const MarkdownIt = require('markdown-it');
const Document = require('../../../lib/document');

describe('MarkdownRenderer', () => {
    const sandbox = sinon.sandbox.create();
    let mdRenderer = null;

    beforeEach(() => {
        mdRenderer = new MarkdownRenderer(new Document('path'));
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('render', () => {
        it('should return empty string if markdown was not passed', () => {
            expect(mdRenderer.render()).to.be.eql('');
        });

        it('should return empty string if markdown is empty', () => {
            expect(mdRenderer.render('')).to.be.eql('');
        });

        it('should throw if markdown passed not as string or Buffer', () => {
            const markdown = {};

            expect(() => mdRenderer.render(markdown)).to.throw(/string or Buffer/);
        });

        it('should render markdown passed as string', () => {
            const markdown = 'Header';
            const html = mdRenderer.render(markdown);

            expect(html).to.be.eql('<p>Header</p>\n');
        });

        it('should render markdown passed as Buffer', () => {
            const markdown = new Buffer('Header');
            const html = mdRenderer.render(markdown);

            expect(html).to.be.eql('<p>Header</p>\n');
        });

        it('should throw if exception during renderer occured', () => {
            sandbox.stub(MarkdownIt.prototype, 'render')
                .throws(new Error('weird render error'));

            expect(() => mdRenderer.render('# Header')).to.throw(/weird render error/);
        });

        it('should apply formatting for code blocks', () => {
            const markdown = '```javascript\n function foo() {}\n```';
            const html = mdRenderer.render(markdown);
            const expected = `<pre><code class="language-javascript"> <span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">foo</span>(<span class="hljs-params"></span>) </span>{}\n</code></pre>\n`;

            expect(html).to.be.eql(expected);
        });

        it('should disable `_` for `<em>` in code block', () => {
            const markdown = '`_variable_`';
            const html = mdRenderer.render(markdown);

            expect(html).to.not.include('<em>')
                .and.to.not.include('</em>');
        });

        it('should disable `__` for `<strong>` in code block', () => {
            const markdown = '`__variable__`';
            const html = mdRenderer.render(markdown);

            expect(html).to.not.include('<strong>')
                .and.to.not.include('</strong>');
        });

        it('should generate table of contents from headings if found `[toc]` entry in document', () => {
            const markdown = '[toc]\n';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<ul class="markdownIt-TOC">');
        });

        it('should not include `h1` headers to ToC', () => {
            const markdown = '[toc]\n# Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.not.include('<a href="#heading">Heading</a>');
        });

        it('should include h2 headers to ToC', () => {
            const markdown = '[toc]\n## Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<a href="#heading">Heading</a>');
        });

        it('should include h3 headers to ToC', () => {
            const markdown = '[toc]\n### Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<a href="#heading">Heading</a>');
        });

        it('should include h4 headers to ToC', () => {
            const markdown = '[toc]\n#### Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<a href="#heading">Heading</a>');
        });

        it('should include h5 headers to ToC', () => {
            const markdown = '[toc]\n##### Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<a href="#heading">Heading</a>');
        });

        it('should include h6 headers to ToC', () => {
            const markdown = '[toc]\n###### Heading';
            const html = mdRenderer.render(markdown);

            expect(html).to.include('<a href="#heading">Heading</a>');
        });

        it('should convert relative links to Zendesk ID paths', () => {
            const document = new Document('path');
            sandbox.stub(document, 'findByPath').returns(12345);
            const renderer = new MarkdownRenderer(document);
            const markdown = '[Link](test/article.md)';
            const html = renderer.render(markdown);

            expect(html)
                .to.include('href="/hc/articles/12345"');
        });

        it('should convert relative image paths to Zendesk ID paths', () => {
            const document = new Document('path');
            sandbox.stub(document, 'findByPath').returns(12345);
            const renderer = new MarkdownRenderer(document);
            const markdown = '![alt text](images/image.jpg "Title Text")';
            const html = renderer.render(markdown);

            expect(html)
                .to.include('src="/hc/article_attachments/12345/image.jpg"');
        });
    });
});
