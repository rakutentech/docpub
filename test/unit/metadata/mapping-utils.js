const mappingUtils = require('../../../lib/metadata/mapping-utils');

describe('Mapping utils', () => {
    describe('mapLabels', () => {
        it('should map comma-separated string of labels to array', () => {
            const labels = 'foo,bar,baz';

            const result = mappingUtils.mapLabels(labels);

            expect(result).to.be.eql(['foo', 'bar', 'baz']);
        });

        it('should map array of labels to array of labels', () => {
            const labels = ['foo', 'bar', 'baz'];

            const result = mappingUtils.mapLabels(labels);

            expect(result).to.be.eql(['foo', 'bar', 'baz']);
        });

        it('should trim labels', () => {
            const labels = [' foo', 'bar ', ' baz '];

            const result = mappingUtils.mapLabels(labels);

            expect(result).to.be.eql(['foo', 'bar', 'baz']);
        });

        it('should remove duplicate labels', () => {
            const labels = ['foo', 'foo'];

            const result = mappingUtils.mapLabels(labels);

            expect(result).to.be.eql(['foo']);
        });

        it('should remove empty labels', () => {
            const labels = ['foo', ''];

            const result = mappingUtils.mapLabels(labels);

            expect(result).to.be.eql(['foo']);
        });
    });
});
