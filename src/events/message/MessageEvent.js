const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class MessageEvent extends BaseEvent {
  constructor() {
    super('messageCreate');
  }
  
  async run(client, message) {
    // console.log("message caught")
    if (message.author.bot) return;
    const config = client.configs.find(c => c.guild_id === message.guildId);
    if (config && config.prefix && message.content.startsWith(config.prefix)) {
      const [cmdName, ...cmdArgs] = message.content
      .slice(config.prefix.length)
      .trim()
      .split(/\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
    }
  }
}