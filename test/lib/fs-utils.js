const mockFs = require('mock-fs');
const fsu = require('../../lib/fs-utils');

describe('fs-utils', () => {
    afterEach(() => {
        mockFs.restore();
    });

    describe('isDirectory', () => {
        it('should return false if passed path is not a directory', () => {
            mockFs({
                'some/dir': {'file.md': 'some_content'}
            });

            expect(fsu.isDirectory('some/dir/file.md')).to.be.false;
        });

        it('should return false if passed path does not exist', () => {
            mockFs({
                'some/dir': {}
            });

            expect(fsu.isDirectory('some/other/dir')).to.be.false;
        });

        it('should return false if path is not passed', () => {
            mockFs({
                'some/dir': {}
            });

            expect(fsu.isDirectory()).to.be.false;
        });

        it('should return true if passed path is directory', () => {
            mockFs({
                'some/dir': {}
            });

            expect(fsu.isDirectory('some/dir')).to.be.true;
        });
    });

    describe('findFile', () => {
        it('should reject if dir name is not specified', () => {
            return expect(fsu.findFile(null, 'file.foo'))
                .to.be.rejectedWith(/Source directory path/);
        });

        it('should reject if dir name is not string', () => {
            return expect(fsu.findFile({}, 'file.foo'))
                .to.be.rejectedWith(/Source directory path/);
        });

        it('should reject if dir name is empty', () => {
            return expect(fsu.findFile('', 'file.foo'))
                .to.be.rejectedWith(/Source directory path/);
        });

        it('should reject if file name is not specified', () => {
            return expect(fsu.findFile('some/dir'))
                .to.be.rejectedWith(/File name/);
        });

        it('should reject if file name is not string', () => {
            return expect(fsu.findFile('some/dir', {}))
                .to.be.rejectedWith(/File name/);
        });

        it('should reject if file name is empty', () => {
            return expect(fsu.findFile('some/dir', ''))
                .to.be.rejectedWith(/File name/);
        });

        it('should reject if file in dir does not exist', () => {
            mockFs({
                'some/dir': {}
            });

            return expect(fsu.findFile('some/dir', 'file.foo'))
                .to.be.rejectedWith(/does not exist or not readable/);
        });

        it('should resolve with path to required file if it does exist', () => {
            mockFs({
                'some/dir': {'file.foo': 'file_content'}
            });

            return expect(fsu.findFile('some/dir', 'file.foo'))
                .to.eventually.match(/file.foo/);
        });

        it('should prepend found file path with source dir path', () => {
            mockFs({
                'some/dir': {'file.foo': 'file_content'}
            });

            return expect(fsu.findFile('some/dir', 'file.foo'))
                .to.be.eventually.eql('some/dir/file.foo');
        });
    });

    describe('listSubdirectories', () => {
        it('should reject if source dir name is not specified', () => {
            return expect(fsu.listSubdirectories())
                .to.be.rejectedWith(/Source path/);
        });

        it('should reject if source dir name is not string', () => {
            return expect(fsu.listSubdirectories({}))
                .to.be.rejectedWith(/Source path/);
        });

        it('should reject if source dir name is empty', () => {
            return expect(fsu.listSubdirectories(''))
                .to.be.rejectedWith(/Source path/);
        });

        it('should resolve with list of subdirectories in directory', () => {
            mockFs({
                dir: {
                    'subdir': {}
                }
            });

            return fsu.listSubdirectories('dir').then(subdirs => {
                expect(subdirs).to.have.length(1);
                expect(subdirs[0]).to.match(/subdir/);
            });
        });

        it('should join src dir path with subdir path', () => {
            mockFs({
                dir: {
                    'subdir': {}
                }
            });

            return fsu.listSubdirectories('dir').then(subdirs => {
                expect(subdirs[0]).to.be.eql('dir/subdir');
            });
        });

        it('shall not list files in results', () => {
            mockFs({
                dir: {
                    'subdir': {},
                    'file.foo': 'content'
                }
            });

            return fsu.listSubdirectories('dir').then(subdirs => {
                expect(subdirs).to.include('dir/subdir')
                    .and.to.not.include('dir/file.foo');
            });
        });
    });
});
