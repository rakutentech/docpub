const Parser = require('../../../../lib/metadata/parser/parser');

describe('Parser', () => {
    describe('constructor', () => {
        it('should throw if key is not defined', () => {
            const key = null;

            expect(() => new Parser(key)).to.throw(/Key/);
        });

        it('should throw if key is not string', () => {
            const key = {};

            expect(() => new Parser(key)).to.throw(/Key/);
        });

        it('should set key', () => {
            const parser = new Parser('key');

            expect(parser.key).to.be.eql('key');
        });

        it('should read is property required from options', () => {
            const parser = new Parser('key', {isRequired: true});

            expect(parser.isRequired).to.be.equal(true);
        });

        it('should mark property not required by default', () => {
            const parser = new Parser('key');

            expect(parser.isRequired).to.be.equal(false);
        });
    });

    describe('parse', () => {
        it('should throw error that method should be redefined in subclasses', () => {
            const parser = new Parser('key');

            expect(() => parser.parse()).to.throw(/redefined/);
        });
    });
});
