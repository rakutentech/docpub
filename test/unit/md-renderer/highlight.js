const highlight = require('../../../lib/md-renderer/highlight');
const hljs = require('highlight.js');
const logger = require('../../../lib/logger');

describe('highlighter', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    it('should return an empty string if language is not specified', () => {
        const code = 'function foo() {}';

        expect(highlight(code)).to.be.eql('');
    });

    it('should not highlight if language is not in list of supported languages', () => {
        const code = 'function foo() {}';
        const weirdLanguage = 'hispster_lang';

        expect(highlight(code, weirdLanguage)).to.be.eql('');
    });

    it('should not hightlight if exception occured during highlighting', () => {
        sandbox.stub(hljs, 'highlight').throws();

        const code = 'function foo() {}';
        const language = 'javascript';

        expect(highlight(code, language)).to.be.eql('');
    });

    it('should log a warning if exception occured during highlighting', () => {
        sandbox.stub(hljs, 'highlight').throws(new Error());
        sandbox.stub(logger, 'warn');

        const code = 'function foo() {}';
        const language = 'javascript';

        highlight(code, language);
        expect(logger.warn).to.be.calledWith(`Highlight.js returned an error. `);
    });

    it('should return highlighted string', () => {
        const code = 'function foo() {}';
        const language = 'javascript';

        expect(highlight(code, language))
            .to.be.eql('<span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">foo</span>(<span class="hljs-params"></span>) </span>{}');
    });

    it('should continue highlighting after meeting syntactically incorrect code', () => {
        const code = 'functionon foo() {const bar = 0;}';
        const language = 'javascript';

        expect(highlight(code, language))
            .to.be.eql('functionon foo() {<span class="hljs-keyword">const</span> bar = <span class="hljs-number">0</span>;}');
    });
});
