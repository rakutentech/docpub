const MarkdownRenderer = require('../../../lib/md-renderer');
const MarkdownIt = require('markdown-it');
const createDocument = require('../test-utils').createDocument;
const createDummyConfig = require('../test-utils').createDummyConfig;

describe('MarkdownRenderer', () => {
    const sandbox = sinon.sandbox.create();
    let mdRenderer = null;

    beforeEach(() => {
        mdRenderer = new MarkdownRenderer(
            createDocument({path: 'path'}),
            createDummyConfig()
        );
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

        it('should not add an <a> tag before the headers', () => {
            const markdown = '[toc]\n# Heading';
            const html = mdRenderer.render(markdown);
            const header = html.match(/<h1 id="heading">.*?<\/h1>/g).pop();

            expect(header).to.not.include('<a');
        });

        it('should convert relative links to Zendesk ID paths', () => {
            const document = createDocument({path: 'path'});
            sandbox.stub(document, 'findByPath').returns(12345);
            const renderer = new MarkdownRenderer(document, createDummyConfig());
            const markdown = '[Link](test/article.md)';
            const html = renderer.render(markdown);

            expect(html)
                .to.include('href="/hc/articles/12345"');
        });

        it('should convert relative image paths to Zendesk ID paths', () => {
            const document = createDocument({path: 'path'});
            sandbox.stub(document, 'findByPath').returns(12345);
            const renderer = new MarkdownRenderer(document, createDummyConfig());
            const markdown = '![alt text](images/image.jpg "Title Text")';
            const html = renderer.render(markdown);

            expect(html)
                .to.include('src="/hc/article_attachments/12345/image.jpg"');
        });

        it('should highlight code blocks if the `highlight` config option is set to true', () => {
            const config = createDummyConfig({
                rendering: {highlight: true}
            });
            const document = createDocument({config: config});
            const renderer = new MarkdownRenderer(document, config);
            const markdown = '```javascript\nfunction foo() {}\n```';
            const html = renderer.render(markdown);

            expect(html)
                .to.be.equal('<pre><code class="language-javascript"><span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">foo</span>(<span class="hljs-params"></span>) </span>{}\n</code></pre>\n');
        });

        it('should not highlight code blocks if the `highlight` config option is set to false', () => {
            const config = createDummyConfig({
                rendering: {highlight: false}
            });
            const document = createDocument({config: config});
            const renderer = new MarkdownRenderer(document, config);
            const markdown = '```javascript\nfunction foo() {}\n```';
            const html = renderer.render(markdown);

            expect(html)
                .to.be.equal('<pre><code class="language-javascript">function foo() {}\n</code></pre>\n');
        });
    });
});
