const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class StatusCommand extends BaseCommand {
  constructor() {
    super('status', 'utilities', []);
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Checks if the BPDAS application bot is running')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON();
  }

  run(client, message, args) {
    message.channel.send(`I'm awake and ready to send traumatized people into a spa 😚`);
    
  }
}