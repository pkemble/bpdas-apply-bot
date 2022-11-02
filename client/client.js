const { Client, ClientOptions, Collection } = require('discord.js');
const BaseEvent = require('../src/utils/structures/BaseEvent');
const BaseCommand = require('../src/utils/structures/BaseCommand');

class DiscordClient extends Client {
    constructor(options) {
        super(options);
    }
    get configs() {
        return this._configs;
    }
    set configs(guildConfigs) {
        this._configs = guildConfigs;
    }
    get applicationQuestions() {
        return this._applicationQuestions
    }
    set applicationQuestions(guildApplicationQuestions) {
        this._applicationQuestions = guildApplicationQuestions;

    }
    get currentConfig() {
        return this._configs.find(c => c.guild_id == this.guild_id);
    }
}

// module.exports = { getCurrentConfig };

