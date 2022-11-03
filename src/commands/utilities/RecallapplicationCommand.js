const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { submitApplication } = require('../../ApplicationWorkflow');
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

    const member = message.options.data[0].member;
    const appLogs = BpdasDatasource.getRepository(ApplicationLog);

    try {
      const dbApp = await appLogs.findOne({
        where: { user_id: member.id },
        order: { application_date: 'DESC' },
      })
      const memberApp = new ApplicationForm()
      const qaArray = JSON.parse(dbApp.application_text);
      memberApp.answers = qaArray;
      memberApp.date = dbApp.application_date;
      memberApp.applicantId = member.id;
      //convert qaArray {question: 'foo', answer: 'bar' } to readable
      let readableApp = `${member} has submitted the following application: \n`;
      for (var qa in qaArray) {
        readableApp += `**${qaArray[qa].question}:** \n${qaArray[qa].answer}\n\n`
      };

      memberApp.readableApp = readableApp;

      submitApplication(client, message, memberApp)
    } catch (error) {
      console.log(error)
    }
  }
}