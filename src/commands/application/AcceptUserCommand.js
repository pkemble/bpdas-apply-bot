const { acceptUser } = require('../../workflows/ApplicationWorkflow');
const BaseCommand = require('../../utils/structures/BaseCommand');
const { SlashCommandBuilder } = require('discord.js')

module.exports = class AcceptUserCommand extends BaseCommand {
  constructor() {
    super('accept', 'application', []);
  }

  run(client, message, args) {
    const guildConfig = client.configs.find(c => c.guild_id == message.guildId);
    const memberToAccept = message.guild.members.cache.get(message.mentions.users.first().id);
    if (memberToAccept) {
      acceptUser(memberToAccept, guildConfig, message)
    } else {
      message.channel.send(`I don't know who "${args[0]}" is...\nCommand format uses mentions like ${guildConfig.prefix}accept @<user name>`);
    };
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Manually accept a user')
      .addUserOption((option) => option.setName('user').setDescription('Tagged target user').setRequired(true))
      .toJSON();
  }
  // async acceptUser(member, guildConfigs, message) {
  //   const newbRole = message.guild.roles.cache.find(r => r.id == guildConfigs.newb_role_id);
  //   const acceptRole = message.guild.roles.cache.find(a => a.id == guildConfigs.accepted_role_id);
  //   if (!newbRole || !acceptRole) {
  //     message.channel.send('check your db roles, bro');
  //     return;
  //   }

  //   try {
  //     member.roles.add(acceptRole);
  //     member.roles.remove(newbRole);
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     console.log(`${member} had roles changed`);
  //   }

  // }
}