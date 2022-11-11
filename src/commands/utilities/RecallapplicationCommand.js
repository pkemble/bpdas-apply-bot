const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { submitApplication } = require('../../workflows/ApplicationWorkflow');
const BpdasDatasource = require('../../typeorm/BpdasDatasource');
const ApplicationLog = require('../../typeorm/entities/ApplicationLog');
const ApplicationForm = require('../../utils/structures/ApplicationForm');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class RecallApplicationCommand extends BaseCommand {
  constructor() {
    super('recallapp', 'utilities', []);
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Recall a users application')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((option) => option.setName('user').setDescription('user app to recall').setRequired(true))
      .toJSON();
  }

  async run(client, message) {
    try {
      const user = message.options.data[0].user;
      const memberApp = new ApplicationForm();
      await memberApp.getFromDatabase(user);
      submitApplication(client, user, memberApp); //TODO check this, user instead of member probably breaks this
      await message.reply(`Retrieving **${user.username}'s** application`);
    } catch (error) {
      console.log(error)
    }
  }
}