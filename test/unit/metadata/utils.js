const utils = require('../../../lib/metadata/utils');

describe('utils', () => {
    describe('defineGetters', () => {
        it('should define all properties from source on recepient', () => {
            const source = {
                foo: 'bar',
                fizz: 'baz'
            };
            const recepient = {};

            utils.defineGetters(recepient, source);

            expect(recepient).to.have.property('foo', 'bar');
            expect(recepient).to.have.property('fizz', 'baz');
        });

        it('should not define getter if key is empty', () => {
            const source = {'': 'bar'};
            const recepient = {};

            utils.defineGetters(recepient, source);

            expect(recepient).to.not.have.property('');
        });

        it('should make properties enumerable', () => {
            const source = {foo: 'bar'};
            const recepient = {};

            utils.defineGetters(recepient, source);

            expect(recepient).ownPropertyDescriptor('foo')
                .to.have.property('enumerable', true);
        });

        it('should make properties configurable', () => {
            const source = {foo: 'bar'};
            const recepient = {};

            utils.defineGetters(recepient, source);

            expect(recepient).ownPropertyDescriptor('foo')
                .to.have.property('configurable', true);
        });

        it('should not make property writeable', () => {
            const source = {foo: 'bar'};
            const recepient = {};

            utils.defineGetters(recepient, source);

            expect(recepient).ownPropertyDescriptor('foo')
                .to.not.have.property('writeable');
        });
    });
});
