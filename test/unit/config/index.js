const _ = require('lodash');
const Config = require('../../../lib/config');
const mockFs = require('mock-fs');

describe('Config', () => {
    afterEach(() => {
        mockFs.restore();
    });

    describe('constructor', () => {
        it('should throw if no doc path and config path provided', () => {
            expect(() => new Config()).to.throw(/No config path and no doc path/);
        });

        it('should read config from the file passed in path', () => {
            stubConfig_({
                path: 'foo/bar/my.config',
                config: {
                    username: 'my_username',
                    token: 'my_token',
                    url: 'my_url'
                }
            });

            const config = new Config('./foo/bar/my.config');

            expect(config).to.have.property('username', 'my_username');
            expect(config).to.have.property('token', 'my_token');
            expect(config).to.have.property('url', 'my_url');
        });

        it('should read config named `docpub.conf` in doc directory if config path was not passed', () => {
            stubConfig_({
                path: 'docpub.conf',
                config: {
                    username: 'my_username',
                    token: 'my_token',
                    url: 'my_url'
                }
            });

            const config = new Config(null, './');

            expect(config).to.have.property('username', 'my_username');
            expect(config).to.have.property('token', 'my_token');
            expect(config).to.have.property('url', 'my_url');
        });

        it('should use config by path if both configs available', () => {
            const configInDirectory = JSON.stringify({
                username: 'directory_username',
                token: 'directory_token',
                url: 'directory_url'
            });

            const configByPath = JSON.stringify({
                username: 'path_username',
                token: 'path_token',
                url: 'path_url'
            });

            mockFs({
                'docpub.conf': configInDirectory,
                'some/path/awesome.config': configByPath
            });

            const config = new Config('some/path/awesome.config', './');

            expect(config).to.have.property('username', 'path_username');
            expect(config).to.have.property('token', 'path_token');
            expect(config).to.have.property('url', 'path_url');
        });

        it('should throw if was not able to find config by config path', () => {
            mockFs({});

            expect(() => new Config('path/to/config.file')).to.throw(/Config file does not exist/);
        });

        it('should throw if was not able to find config in docs dir if config path was not provided', () => {
            mockFs({});

            expect(() => new Config(null, 'path/to/docs')).to.throw(/Config file does not exist/);
        });

        it('should throw if config available but not readable', () => {
            mockFs({
                'broken.config': mockFs.file({mode: '0000'})
            });

            expect(() => new Config('./broken.config')).to.throw(/EACCES/);
        });

        it('should throw if was not able to parse JSON file with config', () => {
            mockFs({
                'docpub.conf': 'random_content'
            });

            expect(() => new Config('./docpub.conf')).to.throw(/JSON/);
        });

        describe('options validation', () => {
            it('should throw if `username` is not provided in config', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        token: 'random_token',
                        url: 'random_url'
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/username/);
            });

            it('should throw if `username` is not string', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 42,
                        token: 'random_token',
                        url: 'random_url'
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/string/);
            });

            it('should throw if `token` is not provided in config', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'random_username',
                        url: 'random_url'
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/token/);
            });

            it('should throw if `token` is not string', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'random_username',
                        token: 123,
                        url: 'random_url'
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/string/);
            });

            it('should throw if `url` is not provided in config', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'random_username',
                        token: 'random_token'
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/url/);
            });

            it('should throw if `url` is not string', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'random_username',
                        token: 'random_token',
                        url: 123
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/string/);
            });
        });

        describe('overrides', () => {
            let oldArgv;
            let oldEnv;

            beforeEach(() => {
                oldArgv = [].concat(process.argv);
                oldEnv = _.clone(process.env);
            });

            afterEach(() => {
                process.env = oldEnv;
                process.argv = oldArgv;
            });

            it('should override option in config with CLI argument beginning with `--`', () => {
                process.argv = process.argv.concat('--username', 'argv_username');
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.username).to.be.equal('argv_username');
            });

            it('should override option in config with ENV variable prefixed with `docpub_`', () => {
                process.env['docpub_username'] = 'env_username';
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.username).to.be.equal('env_username');
            });

            it('should use argv option, if both env and argv options available', () => {
                process.env['docpub_username'] = 'env_username';
                process.argv = process.argv.concat('--username', 'argv_username');
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.username).to.be.equal('argv_username');
            });

            it('should allow options to not be declared in json config if argv option is available', () => {
                process.argv = process.argv.concat('--username', 'argv_username');
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.username).to.be.equal('argv_username');
            });

            it('should allow options to not be declared in json config if env option is available', () => {
                process.env['docpub_username'] = 'env_username';
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: undefined,
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.username).to.be.equal('env_username');
            });
        });
    });

    describe('rendering', () => {
        let oldArgv;
        let oldEnv;

        beforeEach(() => {
            oldArgv = [].concat(process.argv);
            oldEnv = _.clone(process.env);
        });

        afterEach(() => {
            process.env = oldEnv;
            process.argv = oldArgv;
        });

        it('should not throw if `rendering` is not provided', () => {
            stubConfig_({
                path: './docpub.config',
                config: {
                    username: 'default_username',
                    token: 'default_token',
                    url: 'default_url'
                }
            });

            expect(() => new Config('./docpub.config')).to.not.throw();
        });

        describe('overrides', () => {
            it('should override option in config with CLI argument beginning with `--rendering-`', () => {
                process.argv = process.argv.concat('--rendering-highlight', 'false');
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url',
                        rendering: {
                            highlight: true
                        }
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });

            it('should override option in config with ENV variable prefixed with `docpub_rendering_`', () => {
                process.env['docpub_rendering_highlight'] = 'false';
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url',
                        rendering: {
                            highlight: true
                        }
                    },
                    rendering: {
                        highlight: true
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });

            it('should use argv option, if both env and argv options available', () => {
                process.env['docpub_rendering_highlight'] = 'true';
                process.argv = process.argv.concat('--rendering-highlight', 'false');
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'config_username',
                        token: 'default_token',
                        url: 'default_url'
                    }
                });

                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });
        });

        describe('highlight', () => {
            it('should throw if not a boolean', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'default_username',
                        token: 'default_token',
                        url: 'default_url',
                        rendering: {
                            highlight: 'test'
                        }
                    }
                });

                expect(() => new Config('./docpub.config')).to.throw(/boolean/);
            });

            it('should use `true` as default value', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'default_username',
                        token: 'default_token',
                        url: 'default_url',
                        rendering: {}
                    }
                });
                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(true);
            });

            it('should override default value if one is provided', () => {
                stubConfig_({
                    path: './docpub.config',
                    config: {
                        username: 'default_username',
                        token: 'default_token',
                        url: 'default_url',
                        rendering: {
                            highlight: false
                        }
                    }
                });
                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });

            it('should convert a CLI argument to a boolean', () => {
                process.argv = process.argv.concat('--rendering-highlight', 'false');
                stubConfig_({
                    path: './docpub.config'
                });

                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });

            it('should convert an environment variable to a boolean', () => {
                process.env['docpub_rendering_highlight'] = 'false';
                stubConfig_({
                    path: './docpub.config'
                });

                const config = new Config('./docpub.config');

                expect(config.rendering.highlight).to.be.equal(false);
            });
        });
    });
});

function stubConfig_(opts) {
    opts = _.defaults(opts || {}, {
        path: 'docpub.conf',
        config: {
            username: 'default_username',
            token: 'default_token',
            url: 'default_url'
        }
    });

    const path = opts.path;
    const config = JSON.stringify(opts.config);

    mockFs({
        [path]: config
    });
}
