const _ = require('lodash');
const Dictionary = require('../../../lib/meta-parser').Dictionary;

describe('Dictionary', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if key is not defined', () => {
            const key = null;

            expect(() => new Dictionary(key)).to.throw(/Key/);
        });

        it('should throw if key is not string', () => {
            const key = {};

            expect(() => new Dictionary(key)).to.throw(/Key/);
        });

        it('should throw if no parsers passed', () => {
            expect(() => new Dictionary('key')).to.throw(/at least 1 parser/);
        });

        it('should throw if one of parsers is not instance of Parser', () => {
            const parsers = [{}];

            expect(() => new Dictionary('key', parsers))
                .to.throw(/Parser/);
        });

        it('should set key', () => {
            const parser = new Dictionary('key', createDummyParser_());

            expect(parser.key).to.be.eql('key');
        });

        it('should read is property required from options', () => {
            const section = new Dictionary(
                'key',
                createDummyParser_(),
                {isRequired: true}
         );

            expect(section.isRequired).to.be.equal(true);
        });

        it('should mark property not required by default', () => {
            const section = new Dictionary('key', createDummyParser_());

            expect(section.isRequired).to.be.equal(false);
        });
    });

    describe('parse', () => {
        it('should throw if passed json has unexpected keys', () => {
            const section = new Dictionary('key', createDummyParser_({key: 'foo'}));
            const json = {
                foo: 'foo',
                bar: 'bar'
            };

            expect(() => section.parse(json))
                .to.throw(/bar/);
        });

        it('should throw if json missing required property', () => {
            const parsers = [
                createDummyParser_({
                    key: 'foo',
                    isRequired: true
                }),
                createDummyParser_({
                    key: 'bar'
                })
            ];
            const section = new Dictionary('key', parsers);

            const json = {
                bar: 'bar'
            };

            expect(() => section.parse(json))
                .to.throw(/foo/);
        });

        it('should apply parser for corresponding JSON property', () => {
            const parser = createDummyParser_({
                key: 'foo'
            });
            const section = new Dictionary('foo', parser);
            const json = {
                foo: 'bar'
            };

            section.parse(json);

            expect(parser.parse)
                .to.be.calledWith('bar');
        });

        it('should set result of each parser to each parser`s key', () => {
            const parser = createDummyParser_({
                key: 'foo',
                value: 'fizz'
            });
            const section = new Dictionary('foo', parser);
            const result = section.parse({
                foo: 'bar'
            });

            expect(result)
                .to.be.eql({
                    foo: 'fizz'
                });
        });

        it('should apply all parsers with which it was initialised', () => {
            const parsers = [
                createDummyParser_({
                    key: 'foo',
                    value: 'bar'
                }),
                createDummyParser_({
                    key: 'fizz',
                    value: 'buzz'
                })
            ];
            const section = new Dictionary('foo', parsers);
            const result = section.parse({
                foo: '1',
                fizz: 2
            });

            expect(result).to.be.eql({
                foo: 'bar',
                fizz: 'buzz'
            });
        });
    });
});

function createDummyParser_(opts) {
    opts = _.defaults(opts || {}, {
        key: 'key',
        value: 'value',
        isRequired: false
    });

    const parser = sinon.createStubInstance(Dictionary);

    parser.key = opts.key;
    parser.isRequired = opts.isRequired;
    parser.parse.returns(opts.value);

    return parser;
}
