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
    const guildConfig = client.configs.find(c => c.guild_id == interaction.guildId);
    const intro = guildConfig.introduction_text;
    const applicationOutro = guildConfig.application_outro;
    const questionRepo = BpdasDataSource.getRepository(ApplicationQuestions);
    const guildApplicationQuestions = await questionRepo.find({ where: { guild_id: guildConfig.guildId } });

    //establish the applicant
    var user = {}; //ugh - will be a User object
    var forced = false;
    if (interaction.options.data.length > 0) {
      user = interaction.options.data[0].user;
      forced = true;
      console.log(`${user.username} : ${user.id} was found as an argument in the ${this.name} command.`)
    } else {
      user = interaction.member.user;
      console.log(`${user.username} has used the ${this.name} command.`)
    }

    //find a duplicate application in process
    const applicationForm = new ApplicationForm();
    await applicationForm.getFromDatabase(user);

    if (applicationForm && applicationForm.result > 0 && !forced) {
      interaction.reply("There's already an application for you in process, or you were kicked from the server. Please check your DMs. If this is a mistake, please tell a moderator");
      console.log(`Existing application for ${user.username} : ${user.id} has been found. They may need help. DM's closed?`)
    } else {
      //TODO
      // Make sure questions exist
      try {
        const appDm = await user.send(intro);
        console.log(`I sent ${user.username} the following DM: \n----"${intro}"\n----\n`)
        applicationForm.applicantId = user.id;
        applicationForm.result = 1; //pending. enums would be nice
        applicationForm.forced = forced;
        applicationForm.guildId = interaction.guild.id;
        //clear the answers in the application if forced
        if (forced) {
          applicationForm.answers = [];
          interaction.reply(`An application was sent to ${user}`);
        } else {
          await interaction.reply("An application was sent to you through DM. It will expire in 24 hours. Thanks for applying!");
        };
        await applicationForm.saveToDatabase();
        console.log(`==== Starting interrogation with the following questions: ====\n`);
        console.table(guildApplicationQuestions,["question"]);
        await this.interrogate(0, guildApplicationQuestions, appDm, user, applicationForm, applicationOutro)
      } catch (error) {
        console.log(error);
        // interaction !== undefined ? interaction.reply(`Looks like ${member} isn't here anymore...`) : console.log('no interaction');
      }

    }
  }

  async interrogate(i, questions, appDm, user, applicationForm, applicationOutro) {
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
            answer: collected.first().content,
          });
          console.log(`${user.username} reponsded:`)
          console.table(answers[i]);
          if (i === questions.length - 1) {
            appDm.channel.send(applicationOutro);
            let finishedApplication = `${user} has submitted the following application: \n`;
            answers.forEach(async a => {
              finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
              let que = a.question, ans = a.answer;
              applicationForm.addAnswer({ question: que, answer: ans });
              applicationForm.readableApp = finishedApplication;
            });
            submitApplication(this.client, user, applicationForm);
            console.log(`==== Interrogation complete for ${user.username}. ====`)
            return;

          } else {
            i++;
            this.interrogate(i, questions, appDm, user, applicationForm, applicationOutro)
          }
        }).catch((err) => {
          console.log(err);
        });
    });
  };
}
