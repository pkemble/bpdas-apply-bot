const BpdasDatasource = require('../../typeorm/BpdasDatasource');
const ApplicationQuestions = require('../../typeorm/entities/ApplicationQuestions');
const BaseCommand = require('../../utils/structures/BaseCommand');
const ApplicationForm = require('../../utils/structures/ApplicationForm');
const { submitApplication } = require('../../workflows/ApplicationWorkflow');
const { SlashCommandBuilder } = require('discord.js');

let answers = [];

module.exports = class ApplyCommand extends BaseCommand {
  constructor() {
    super('apply', 'application', []);
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Apply to the BPDAS Server')
      // .addUserOption((option) => option.setName('user').setDescription('Tagged target user').setRequired(true))
      .toJSON();
  }

  async run(client, interaction) {
    if (interaction.member.user.bot) return;
    this.client = client;
    const intro = guildConfig.introduction_text;
    const applicationOutro = guildConfig.application_outro;
    const questionRepo = BpdasDataSource.getRepository(ApplicationQuestions);
    const guildApplicationQuestions = await questionRepo.find();
    client.applicationQuestions = guildApplicationQuestions;
    const questions = client.applicationQuestions; //redundant...
    const appDm = await interaction.member.user.send(intro);
    await this.interrogate(0, questions, appDm, interaction, applicationOutro)

  }

  async interrogate(i, questions, appDm, interaction, applicationOutro) {
    const question = questions[i].question;
    const applicationForm = new ApplicationForm();
    applicationForm.applicantId = interaction.member.user.id;

    const filter = m => m.author.id === applicationForm.applicantId;

    await appDm.channel.send(question).then(async () => {
      await appDm.channel
        .awaitMessages({
          filter,
          max: 1,
          time: 60_000 * 60 * 24,
          errors: ['application timed out']
        }).then((collected) => {
          answers.push({
            question: questions[i].question,
            answer: collected.first(),
          });
          if (i === questions.length - 1) {
            appDm.channel.send(applicationOutro);
            let finishedApplication = `${interaction.member.user} has submitted the following application: \n`;
            answers.forEach(a => {
              finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
              let que = a.question, ans = a.answer.content;
              applicationForm.addAnswer({ question: que, answer: ans });
              applicationForm.readableApp = finishedApplication;
            });

            applicationForm.saveToDatabase();
            submitApplication(this.client, interaction, applicationForm);
            answers = [] //for some reason these are persisting. maybe collector related.
            return;
          } else {
            i++;
            this.interrogate(i, questions, appDm, interaction, applicationOutro)
          }
        }).catch((err) => {
          console.log(err);
        });
    });
  };
}