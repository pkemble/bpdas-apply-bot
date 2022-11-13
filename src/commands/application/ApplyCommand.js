const BpdasDatasource = require('../../typeorm/BpdasDatasource');
const ApplicationQuestions = require('../../typeorm/entities/ApplicationQuestions');
const BaseCommand = require('../../utils/structures/BaseCommand');
const ApplicationForm = require('../../utils/structures/ApplicationForm');
const { submitApplication } = require('../../workflows/ApplicationWorkflow');
const { SlashCommandBuilder } = require('discord.js');
const client = null;
let answers = [];

module.exports = class ApplyCommand extends BaseCommand {
  constructor() {
    super('apply', 'application', []);
  }


  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Apply to the BPDAS Server')
      .addUserOption((option) => option.setName('user').setDescription('Tagged target user').setRequired(false))
      .toJSON();
  }

  async run(client, interaction) {
    if (interaction.member.user.bot) return;
    this.client = client;
    //const guildConfig = client.getCurrentConfig(message.guildId);
    const guildConfig = client.configs.find(c => c.guild_id == interaction.guildId);
    const intro = guildConfig.introduction_text;
    const applicationOutro = guildConfig.application_outro;
    const questionRepo = BpdasDataSource.getRepository(ApplicationQuestions);
    const guildApplicationQuestions = await questionRepo.find();

    //establish the applicant
    var member = {}; //ugh
    var forced = false;
    if (interaction.options.data.length > 0) {
      member = interaction.options.data[0].user;
      forced = true;
    } else {
      member = interaction.member;
    }

    //find a duplicate application in process
    const applicationForm = new ApplicationForm();
    await applicationForm.getFromDatabase(member.user);

    if (applicationForm && applicationForm.result > 0 && !forced) {
      interaction.reply("There's already an application for you in process, or you were kicked from the server. Please check your DMs. If this is a mistake, please tell a moderator");
      console.log(`${member} tried to apply more than once.`)
    } else {
      //TODO
      // Make sure questions exist
      try {
        const appDm = await member.send(intro);
        applicationForm.applicantId = member.id;
        applicationForm.result = 1; //pending. enums would be nice
        applicationForm.forced = forced;
        applicationForm.guildId = interaction.guild.id;
        //clear the answers in the application if forced
        if (forced) { applicationForm.answers = [] };
        await applicationForm.saveToDatabase();
        forced ? await interaction.reply(`An application was DM'd to ${member}.`) : await interaction.reply("A DM was sent to you. Thanks for applying!");
        await this.interrogate(0, guildApplicationQuestions, appDm, member, applicationForm, applicationOutro)
      } catch (error) {
        console.log(error);
        interaction.reply(`Looks like ${member} isn't here anymore...`);
      }

    }
  }

  async interrogate(i, questions, appDm, member, applicationForm, applicationOutro) {
    const question = questions[i].question;
    const filter = m => m.author.id === applicationForm.applicantId;

    await appDm.channel.send(question).then(async () => {
      await appDm.channel
        .awaitMessages({
          filter,
          max: 1,
          time: 60_000 * 60 * 24,
          errors: ['application timed out']
        }).then(async (collected) => {
          answers.push({
            question: questions[i].question,
            answer: collected.first(),
          });
          if (i === questions.length - 1) {
            appDm.channel.send(applicationOutro);
            let finishedApplication = `${member} has submitted the following application: \n`;
            answers.forEach(async a => {
              finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
              let que = a.question, ans = a.answer.content;
              applicationForm.addAnswer({ question: que, answer: ans });
              applicationForm.readableApp = finishedApplication;
            });
            submitApplication(this.client, member, applicationForm);
            return;

          } else {
            i++;
            this.interrogate(i, questions, appDm, member, applicationForm, applicationOutro)
          }
        }).catch((err) => {
          console.log(err);
        });
    });
  };
}