const _ = require('lodash');
const clearRequire = require('clear-require');
let logger;

describe('logger', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        logger = require('../../lib/logger');

        sandbox.spy(console, 'log');
        sandbox.spy(console, 'warn');
        sandbox.spy(console, 'error');
    });

    afterEach(() => {
        clearRequire('../../lib/logger');

        sandbox.restore();
    });

    describe('Uninitialized', () => {
        it('should have trace method equal to noop', () => {
            expect(logger.trace).to.be.equal(_.noop);
        });

        it('should have info method equal to noop', () => {
            expect(logger.info).to.be.equal(_.noop);
        });

        it('should have warn method equal to noop', () => {
            expect(logger.warn).to.be.equal(_.noop);
        });

        it('should have error method equal to noop', () => {
            expect(logger.error).to.be.equal(_.noop);
        });
    });

    describe('Initialized', () => {
        describe('trace', () => {
            it('should be equal to noop if logger initalized in non-verbose mode', () => {
                logger.setup();

                expect(logger.trace).to.be.equal(_.noop);
            });

            it('should be a logging function if logger initialized in verbose mode', () => {
                logger.setup({verbose: true});

                expect(logger.trace).to.be.not.equal(_.noop);
            });

            it('should log messages to console.log', () => {
                logger.setup({verbose: true});

                logger.trace('bla');

                expect(console.log).to.be.calledWith('bla');
            });

            it('should stringify input if it`s not a string', () => {
                logger.setup({verbose: true});

                logger.trace({foo: 'bar'});

                expect(console.log).to.be.calledWith('{"foo":"bar"}');
            });
        });

        describe('info', () => {
            it('should be a logging function after initialisation', () => {
                logger.setup();

                expect(logger.info).to.be.not.equal(_.noop);
            });

            it('should log messages to console.log', () => {
                logger.setup();

                logger.info('bla');

                expect(console.log).to.be.calledWith('bla');
            });

            it('should stringify input if it`s not a string', () => {
                logger.setup();

                logger.info({foo: 'bar'});

                expect(console.log).to.be.calledWith('{"foo":"bar"}');
            });
        });

        describe('warn', () => {
            it('should be a logging function after initialisation', () => {
                logger.setup();

                expect(logger.warn).to.be.not.equal(_.noop);
            });

            it('should log messages to console.warn', () => {
                logger.setup();

                logger.warn('bla');

                expect(console.warn).to.be.calledWithMatch('bla');
            });

            it('should stringify input if it`s not a string', () => {
                logger.setup();

                logger.warn({foo: 'bar'});

                expect(console.warn).to.be.calledWithMatch('{"foo":"bar"}');
            });
        });

        describe('error', () => {
            it('should be a logging function after initialisation', () => {
                logger.setup();

                expect(logger.error).to.be.not.equal(_.noop);
            });

            it('should log messages to console.error', () => {
                logger.setup();

                logger.error('bla');

                expect(console.error).to.be.calledWithMatch('bla');
            });

            it('should stringify input if it`s not a string', () => {
                logger.setup();

                logger.error({foo: 'bar'});

                expect(console.error).to.be.calledWithMatch('{"foo":"bar"}');
            });
        });
    });

    describe('setup', () => {
        it('should define trace method in verbose mode', () => {
            logger.setup({verbose: true});

            expect(logger.trace).to.be.not.equal(_.noop);
        });

        it('should not define trace method in not verbose mode', () => {
            logger.setup({verbose: false});

            expect(logger.trace).to.be.equal(_.noop);
        });

        it('should define info method in verbose mode', () => {
            logger.setup({verbose: true});

            expect(logger.info).to.be.not.equal(_.noop);
        });

        it('should define info method in not verbose mode', () => {
            logger.setup({verbose: false});

            expect(logger.info).to.be.not.equal(_.noop);
        });

        it('should define warn method in verbose mode', () => {
            logger.setup({verbose: true});

            expect(logger.warn).to.be.not.equal(_.noop);
        });

        it('should define warn method in not verbose mode', () => {
            logger.setup({verbose: false});

            expect(logger.warn).to.be.not.equal(_.noop);
        });

        it('should define error method in verbose mode', () => {
            logger.setup({verbose: true});

            expect(logger.error).to.be.not.equal(_.noop);
        });

        it('should define error method in not verbose mode', () => {
            logger.setup({verbose: false});

            expect(logger.error).to.be.not.equal(_.noop);
        });
    });
});
