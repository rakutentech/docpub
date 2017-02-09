const hash = require('../../lib/hash');

describe('hash', () => {
    it('should throw if param is not a string or Buffer', () => {
        expect(() => hash(123)).to.throw(/string or Buffer/);
    });

    it('should return same hash for same input', () => {
        const firstHash = hash('foo');
        const secondHash = hash('foo');

        expect(firstHash).to.be.equal(secondHash);
    });

    it('should return different hashes for different input', () => {
        const firstHash = hash(Buffer('foo'));
        const secondHash = hash(Buffer('bar'));

        expect(firstHash).to.be.not.equal(secondHash);
    });
});
