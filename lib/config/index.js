const fs = require('fs');
const path = require('path');
const applyScheme = require('./scheme');
const defineGetters = require('../metadata/utils').defineGetters;

const DEFAULT_CONFIG_NAME = 'docpub.conf';

module.exports = class Config {
    constructor(configPath, docPath) {
        if (!docPath && !configPath) {
            throw new Error('No config path and no doc path provided');
        }

        this._configPath = path.resolve(configPath || path.join(docPath, DEFAULT_CONFIG_NAME));

        this._load();
    }

    _load() {
        const raw = this._read();
        const parsed = this._parse(raw);

        defineGetters(this, parsed);
    }

    _read() {
        try {
            return fs.readFileSync(this._configPath, 'utf-8');
        } catch (e) {
            if (e.code === 'ENOENT') {
                throw new Error(`Config file does not exist: ${this._configPath}`);
            }
            throw e;
        }
    }

    _parse(raw) {
        const json = JSON.parse(raw);
        const env = process.env;
        const argv = process.argv;

        return applyScheme({
            options: json,
            env,
            argv
        });
    }
};
