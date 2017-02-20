const mockFs = require('mock-fs');
const fs = require('fs-promise');
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
        const sandbox = sinon.sandbox.create();

        afterEach(() => {
            sandbox.restore();
        });

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

        it('shall not list directories which name starts with `.`', () => {
            mockFs({
                dir: {
                    '.subdir': {}
                }
            });

            return fsu.listSubdirectories('dir').then(subdirs => {
                expect(subdirs).to.be.empty;
            });
        });

        it('shall not list entries for which failed to get stats', () => {
            mockFs({
                dir: {
                    'subdir': {}
                }
            });

            sandbox.stub(fs, 'stat').rejects();

            return fsu.listSubdirectories('dir').then(subdirs => {
                expect(subdirs).to.be.empty;
            });
        });
    });

    describe('findFilesOfTypes', () => {
        it('should reject if types to look for are not passed', () => {
            return expect(fsu.findFilesOfTypes('dir'))
                .to.be.rejectedWith(/not defined/);
        });

        it('should reject if source dir name is not specified', () => {
            return expect(fsu.findFilesOfTypes(undefined, ['.ext']))
                .to.be.rejectedWith(/Source path/);
        });

        it('should reject if source dir name is not string', () => {
            return expect(fsu.findFilesOfTypes({}, ['.ext']))
                .to.be.rejectedWith(/Source path/);
        });

        it('should find files by extension', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return fsu.findFilesOfTypes('dir', ['.foo'])
                .then(files => {
                    expect(files).to.have.length(1);
                    expect(files[0]).to.match(/file.foo/);
                });
        });

        it('should prepend file names with source dir path', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return fsu.findFilesOfTypes('dir', ['.foo'])
                .then(files => {
                    const file = files[0];

                    expect(file).to.match(/^dir/);
                });
        });

        it('should not include files of extensions different from required', () => {
            mockFs({
                dir: {
                    'file.bar': 'content'
                }
            });

            return fsu.findFilesOfTypes('dir', ['.foo'])
                .then(files => {
                    expect(files).have.length(0);
                });
        });

        it('should skip directories having matching extension in name', () => {
            mockFs({
                dir: {
                    'another_dir.foo': {}
                }
            });

            return fsu.findFilesOfTypes('dir', ['.foo'])
                .then(files => {
                    expect(files).to.have.length(0);
                });
        });

        it('should support single extension passed as string', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return expect(fsu.findFilesOfTypes('dir', '.foo'))
                .to.eventually.become([
                    'dir/file.foo'
                ]);
        });

        it('should support extensions passed as string not beginning with dot', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return expect(fsu.findFilesOfTypes('dir', 'foo'))
                .to.eventually.become([
                    'dir/file.foo'
                ]);
        });

        it('should ignore empty strings in extensions', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return expect(fsu.findFilesOfTypes('dir', ['']))
                .to.eventually.become([]);
        });

        it('should ignore extensions passed as non-string extensions', () => {
            mockFs({
                dir: {
                    'file.foo': 'content'
                }
            });

            return expect(fsu.findFilesOfTypes('dir', {}))
                .to.eventually.become([]);
        });
    });
});
