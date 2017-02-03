const validationUtils = require('../../../lib/metadata/validation-utils');

describe('Validation utils', () => {
    describe('shouldBeNumber', () => {
        it('should throw if value is not a number', () => {
            expect(() => validationUtils.shouldBeNumber('1'))
                .to.throw(/number/);
        });

        it('should not throw if value is a number', () => {
            expect(() => validationUtils.shouldBeNumber(1))
                .to.not.throw();
        });
    });

    describe('shouldBeString', () => {
        it('should throw if value is not a string', () => {
            expect(() => validationUtils.shouldBeString(1))
                .to.throw(/string/);
        });

        it('should not throw if value is a string', () => {
            expect(() => validationUtils.shouldBeString('foo'))
                .to.not.throw();
        });
    });

    describe('validateViewableBy', () => {
        it('should throw if value is not a string', () => {
            expect(() => validationUtils.validateViewableBy(1))
                .to.throw(/string/);
        });

        ['everybody', 'signed_in_users', 'staff'].forEach(allowed => {
            it(`should not throw if passed allowed value ${allowed}`, () => {
                expect(() => validationUtils.validateViewableBy(allowed))
                    .to.not.throw();
            });
        });

        it('should throw if passed not white-listed value', () => {
            expect(() => validationUtils.validateViewableBy('everyone_in_this_company'))
                .to.throw(/Value must be/);
        });
    });

    describe('validateManageableBy', () => {
        it('should throw if value is not a string', () => {
            expect(() => validationUtils.validateManageableBy(1))
                .to.throw(/string/);
        });

        ['staff', 'managers'].forEach(allowed => {
            it(`should not throw if passed allowed value ${allowed}`, () => {
                expect(() => validationUtils.validateManageableBy(allowed))
                    .to.not.throw();
            });
        });

        it('should throw if passed not white-listed value', () => {
            expect(() => validationUtils.validateManageableBy('me_the_great'))
                .to.throw(/Value must be/);
        });
    });

    describe('validateLabels', () => {
        it('should not throw if passed value is a string', () => {
            expect(() => validationUtils.validateLabels('foo'))
                .to.not.throw();
        });

        it('should not throw if passed value is an Array', () => {
            expect(() => validationUtils.validateLabels(['foo']))
                .to.not.throw();
        });

        it('should throw if passed value neither string nor Array', () => {
            expect(() => validationUtils.validateLabels(1))
                .to.throw(/Array or string/);
        });
    });
});
