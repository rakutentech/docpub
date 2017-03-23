const fs = require('fs');
const path = require('path');
const applyScheme = require('./scheme');
const defineGetters = require('../metadata/utils').defineGetters;

const DEFAULT_CONFIG_NAME = 'docpub.conf';

/**
 * Config class representing docpub configuration. Used for reading config file,
 * parsing it and overriding with CLI args and ENV variables.
 * Default cinfig file name: `docpub.conf`
 * Supported config format: JSONs
 *
 * Config supports 2 methods of locating config file:
 * 1. If config path specified, just read file by this path
 * 2. If config path is not specified, config would be searched in documents directory by `docpub.conf` name
 * If failed to find config, exception will be thrown
 *
 * Config supports 2 methods of overloading JS file content:
 * 1. CLI option with name in kebab-case.
 * 2. ENV variable with name in snake_case.
 *
 * If both CLI option and ENV variable are presented, CLI option takes precedence
 *
 * All required config options must be defined.
 * If required options is missing in JS file and not overloaded either by CLI option or ENV variable,
 * exception would be thrown
 * If required options is missing in JS file, but this option is redefined either by CLI option
 * or by ENV variable, this option would be used taking in account precedence.
 *
 * If failed to parse config file because of corrupted JSON structure, exception would be thrown
 *
 * After reading and overloading config values, all of them are populated on config instance as read-only getters.
 */
module.exports = class Config {
    /**
     * Creates config instance.
     * If configPath provided, reads config by this path. Otherwise will search config in
     * docPath directory by `docpub.conf` name
     * After reading config, applies config scheme to it, overriding values with CLI and ENV variables
     * if they present.
     * After this, populates config values on self as readonly properties
     *
     * @param  {string} configPath - path to custom config file. Must be path to a file, not to directory, where config located
     * @param  {string} docPath - path to documents directory
     * @throws {Error} - will throw error if configPath and docPath are not defined
     * @throws {Error} - will throw error if failed to locate config file
     * @throws {Error} - will throw error if failed to parse config JSON file
     * @throws {Error} - will throw error if required fields are missing in the config
     */
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
        return applyScheme({
            options: JSON.parse(raw),
            env: process.env,
            argv: process.argv
        });
    }
};
