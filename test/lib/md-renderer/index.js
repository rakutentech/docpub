const MarkdownRenderer = require('../../../lib/md-renderer');
const MarkdownIt = require('markdown-it');

describe('MarkdownRenderer', () => {
    const sandbox = sinon.sandbox.create();
    let mdRenderer = null;

    beforeEach(() => {
        mdRenderer = new MarkdownRenderer();
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
            const markdown = '# Header';
            const html = mdRenderer.render(markdown);

            expect(html).to.be.eql('<h1>Header</h1>\n');
        });

        it('should render markdown passed as Buffer', () => {
            const markdown = new Buffer('# Header');
            const html = mdRenderer.render(markdown);

            expect(html).to.be.eql('<h1>Header</h1>\n');
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
    });
});
