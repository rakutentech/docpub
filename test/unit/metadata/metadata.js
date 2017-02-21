const mockFs = require('mock-fs');
const Metadata = require('../../../lib/metadata/metadata');
const Dictionary = require('../../../lib/metadata/parser/dictionary');
const Property = require('../../../lib/metadata/parser/property');
const hash = require('../../../lib/hash');
const logger = require('../../../lib/logger');

const fs = require('fs-promise');

describe('Metadata', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        mockFs.restore();
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Metadata(path)).to.throw(/string/);
        });

        it('should throw if path is empty', () => {
            const path = '';

            expect(() => new Metadata(path)).to.throw(/empty/);
        });

        it('should throw if user meta scheme is not an instance of Dictionary', () => {
            const userScheme = {};

            expect(() => new Metadata('foo', userScheme))
                .to.throw(/Dictionary/);
        });

        it('should throw if user meta scheme is not a root', () => {
            const userScheme = sinon.createStubInstance(Dictionary);

            expect(() => new Metadata('foo', userScheme))
                .to.throw(/JSON file/);
        });

        it('should throw if system meta scheme is not an instance of Dictionary', () => {
            const userScheme = createRootSchemeStub_();
            const systemScheme = {};

            expect(() => new Metadata('foo', userScheme, systemScheme))
                .to.throw(/Dictionary/);
        });

        it('should throw if system meta scheme is not a root', () => {
            const userScheme = createRootSchemeStub_();
            const systemScheme = sinon.createStubInstance(Dictionary);

            expect(() => new Metadata('foo', userScheme, systemScheme))
                .to.throw(/JSON file/);
        });
    });

    describe('read', () => {
        beforeEach(() => {
            sandbox.stub(logger, 'warn');
        });

        it('should read user settings from `meta.json`', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    expect(metadata).to.have.property('foo', 'bar');
                });
        });

        it('should reject if `meta.json` is missing from user dir', () => {
            mockFs({
                dir: {'.meta.json': '{"foo": "bar"}'}
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return expect(metadata.read())
                .to.be.rejectedWith(/meta.json does not exist/);
        });

        it('should reject if was unable to parse content of `meta.json`', () => {
            mockFs({
                dir: {
                    'meta.json': 'broken_json'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return expect(metadata.read())
                .to.be.rejectedWith(/JSON/);
        });

        it('should read system settings from `.meta.json`', () => {
            mockFs({
                dir: {
                    'meta.json': '{"user": "info"}',
                    '.meta.json': '{"foo": "bar"}'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = Dictionary.createRoot(new Property('foo'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    expect(metadata).to.have.property('foo', 'bar');
                });
        });

        it('should not reject if `.meta.json` is missing in folder', () => {
            mockFs({
                dir: {
                    'meta.json': '{}'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return expect(metadata.read()).to.be.fulfilled;
        });

        it('should not log warning if `.meta.json` is missing in folder', () => {
            mockFs({
                dir: {
                    'meta.json': '{"user": "content"}'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => expect(logger.warn).to.be.not.called);
        });

        it('should not reject if was not able to parse `.meta.json` content', () => {
            mockFs({
                dir: {
                    'meta.json': '{"user": "content"}',
                    '.meta.json': 'broken_json'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = Dictionary.createRoot(new Property('foo', {defaultValue: ''}));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return expect(metadata.read()).to.be.fulfilled;
        });

        it('should log warning if failed to parse contents of `.meta.json`', () => {
            mockFs({
                dir: {
                    'meta.json': '{"user": "content"}',
                    '.meta.json': 'broken_json'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    expect(logger.warn).to.be.calledWithMatch('Failed to parse .meta.json for dir');
                });
        });

        it('should populate metadata properties as own enumerable and configurable read-only properties', () => {
            mockFs({
                dir: {'meta.json': '{"foo": "bar"}'}
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    expect(metadata).ownPropertyDescriptor('foo').to.have.property('enumerable', true);
                    expect(metadata).ownPropertyDescriptor('foo').to.have.property('configurable', true);
                });
        });
    });

    describe('update', () => {
        it('should update system properties with new data', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}',
                    '.meta.json': '{"fizz": "buzz"}'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = Dictionary.createRoot(new Property('fizz'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    metadata.update({fizz: 'fizzbuzz'});

                    expect(metadata.fizz).to.be.eql('fizzbuzz');
                });
        });

        it('should update values described by system meta scheme', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}',
                    '.meta.json': '{"fizz": "buzz"}'
                }
            });

            const userScheme = createRootSchemeStub_();
            const systemScheme = Dictionary.createRoot(new Property('fizz'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    metadata.update({fizz: 'fizzbuzz', 'weird_property': 'weird_value'});

                    expect(metadata.fizz).to.not.have.property('weird_property');
                });
        });

        it('should not update values described by user meta scheme', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}',
                    '.meta.json': '{"fizz": "buzz"}'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = Dictionary.createRoot(new Property('fizz'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    metadata.update({foo: 'FUBAR'});

                    expect(metadata.foo).to.be.equal('bar');
                });
        });

        it('should update meta state even if read was not called', () => {
            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = Dictionary.createRoot(new Property('fizz'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            metadata.update({fizz: 'FUBAR'});

            expect(metadata).to.have.property('fizz', 'FUBAR');
        });
    });

    describe('write', () => {
        beforeEach(() => {
            sandbox.stub(fs, 'ensureFile').resolves();
            sandbox.stub(fs, 'writeFile').resolves();
        });

        it('should write system meta to `.meta.json` file', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}',
                    '.meta.json': '{"fizz": "buzz"}'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = Dictionary.createRoot(new Property('fizz'));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => metadata.write())
                .then(() => {
                    expect(fs.writeFile).to.be.calledWith('dir/.meta.json', '{"fizz":"buzz"}');
                });
        });

        it('should write correctly if .meta.json does not exists in dir', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = Dictionary.createRoot(new Property('fizz', {defaultValue: 'buzz'}));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => metadata.write())
                .then(() => {
                    expect(fs.writeFile).to.be.calledWith('dir/.meta.json', '{"fizz":"buzz"}');
                });
        });

        it('should reject if write process ended up with error', () => {
            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = Dictionary.createRoot(new Property('fizz', {defaultValue: 'buzz'}));
            const metadata = new Metadata('dir', userScheme, systemScheme);

            fs.writeFile.rejects(new Error('Unable to write'));

            return expect(metadata.write()).to.be.rejectedWith('Unable to write');
        });
    });

    describe('userMetaHash', () => {
        it('should return hash of stringified user meta', () => {
            mockFs({
                dir: {
                    'meta.json': '{"foo": "bar"}'
                }
            });

            const userScheme = Dictionary.createRoot(new Property('foo'));
            const systemScheme = createRootSchemeStub_();
            const metadata = new Metadata('dir', userScheme, systemScheme);

            return metadata.read()
                .then(() => {
                    const expected = hash(JSON.stringify({foo: 'bar'}));

                    expect(metadata.userMetaHash).to.be.equal(expected);
                });
        });
    });

    function createRootSchemeStub_() {
        const stub = sinon.createStubInstance(Dictionary);

        stub.key = 'ROOT';
        stub.parse.returns({});

        return stub;
    }
});
