const _ = require('lodash');
const Property = require('../../../../lib/metadata/parser').Property;

describe('Property', () => {
    describe('constructor', () => {
        it('should throw if key is not a string', () => {
            const key = {};

            expect(() => new Property(key)).to.throw(/string/);
        });

        it('should throw if key is empty', () => {
            const key = '';

            expect(() => new Property(key)).to.throw(/empty/);
        });

        it('should throw if validator is not a function', () => {
            const validator = 'toString';

            expect(() => new Property('key', {validate: validator}))
                .to.throw(/not a function/);
        });

        it('should throw if mapper is not a function', () => {
            const mapper = 'toString';

            expect(() => new Property('key', {map: mapper}))
                .to.throw(/not a function/);
        });

        it('should set key', () => {
            const parser = new Property('key');

            expect(parser.key).to.be.eql('key');
        });

        it('should read is property required from options', () => {
            const parser = new Property('key', {isRequired: true});

            expect(parser.isRequired).to.be.equal(true);
        });

        it('should mark property not required by default', () => {
            const parser = new Property('key');

            expect(parser.isRequired).to.be.equal(false);
        });
    });

    describe('parse', () => {
        it('should parse value passed for parsing', () => {
            const parser = new Property('key');

            expect(parser.parse('foo')).to.be.eql('foo');
        });

        it('should throw if value is undefined and default value is undefined', () => {
            const parser = new Property('foo');

            expect(() => parser.parse(undefined)).to.throw(/foo/);
        });

        it('should return default value if value to parse undefined', () => {
            const parser = new Property('foo', {
                defaultValue: 'bar'
            });

            expect(parser.parse(undefined)).to.be.equal('bar');
        });

        it('should not change falsy value to default value', () => {
            const parser = new Property('foo', {
                defaultValue: 'bar'
            });

            expect(parser.parse('')).to.be.equal('');
        });

        it('should apply validation function for value', () => {
            const validator = value => {
                if (!_.isNumber(value)) {
                    throw new Error('Number expected');
                }
            };

            const parser = new Property('foo', {
                validate: validator
            });

            expect(() => parser.parse('foo')).to.throw('Number expected');
        });

        it('should apply validation function for default value if value is undefined', () => {
            const validator = value => {
                if (!_.isNumber(value)) {
                    throw new Error(`Number expected. Got ${typeof value}`);
                }
            };

            const parser = new Property('foo', {
                validate: validator,
                defaultValue: 'foo'
            });

            expect(() => parser.parse(undefined)).to.throw('Number expected. Got string');
        });

        it('should map value if mapping function provided', () => {
            const parser = new Property('foo', {
                map: _.toString
            });

            expect(parser.parse(5)).to.be.equal('5');
        });

        it('should map default value if mapping function provided and value is undefined', () => {
            const parser = new Property('foo', {
                map: _.toString,
                defaultValue: 5
            });

            expect(parser.parse(undefined)).to.be.equal('5');
        });
    });
});
