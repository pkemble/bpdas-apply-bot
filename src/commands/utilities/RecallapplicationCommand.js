const { SlashCommandBuilder, PermissionFlagsBits, Colors, EmbedBuilder } = require('discord.js');
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
      if (memberApp.applicantId === undefined) {
        message.reply(`No appluication for ${user.username} exists...`)
        return;
      }
      // const row = new ActionRowBuilder().setComponents(
      //   new ButtonBuilder()
      //     .setCustomId(`apply_button_accept_${applicationForm.applicantId}`)
      //     .setLabel('accept')
      //     .setStyle(ButtonStyle.Success),
      //   new ButtonBuilder()
      //     .setCustomId(`apply_button_deny_${applicationForm.applicantId}`)
      //     .setLabel('deny')
      //     .setStyle(ButtonStyle.Danger),
      //   new ButtonBuilder()
      //     .setCustomId(`apply_button_spa_${applicationForm.applicantId}`)
      //     .setLabel('spa time')
      //     .setStyle(ButtonStyle.Primary)
      // );
      let color = Colors.Yellow;
      switch (memberApp.result) {
        case 0: //not started - something went wrong
          color = Colors.DarkButNotBlack;
          break;
        case 1: //pending
          color = Colors.Yellow;
          break;
        case 2: //accepted
          color = Colors.Green;
          break;
        case 3: //denied
          color = Colors.Red;
          break;
        case 4: //spa time
          color = Colors.DarkGold;
          break;
        default: //whatevs
          color = Colors.Yellow;
          break;
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(memberApp.readableApp) //TODO moderator actions should go here

      await message.reply({
        // content: finishedApplication,
        // components: [row],
        embeds: [embed],
      });
      console.log(`Application for ${user.username} has been recalled by ${message.user.username} in #${message.channel.name}`);

    } catch (error) {
      console.log(error)
    }
  }
}