const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, EmbedBuilder, GuildMemberManager, Colors, Embed } = require('discord.js');
const ApplicationWorkflow = require('../../ApplicationWorkflow');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class TacceptCommand extends BaseCommand {
  constructor() {
    super('taccept', 'test', []);
  }

  async run(client, message, args) {

    const testId = "1035972676482760737" //testdoc
    //const testUser = message.guild.members.cache.find(m => m.id == testId);
    const testDescription = `<@1035972676482760737> has submitted the following application:
    How old are you?:
    46
    
    How did you find this server? If a member invited you, please list the member's name and the app/website where you received the invitation.:
    foo
    
    Who has BPD (relationship), and is it diagnosed or undiagnosed?:
    sii`
    const testUser = await message.guild.members.fetch(testId);
    const row = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId(`button_accept`)
        .setLabel('accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`button_deny`)
        .setLabel('deny')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`button_spa`)
        .setLabel('spa time')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0x0234FF)
      .setDescription(testDescription)

    const testComp = { test: 'objectId' };

    message.channel.send({
      //content: `${testUser} has submitted the following application:`,
      components: [row],
      embeds: [embed],
    });

    client.on('interactionCreate', (interaction) => {
      console.log(interaction);
      try {
        const member = interaction.message.mentions.users.first();
        switch (interaction.customId) {
          case 'button_accept':
            //ApplicationWorkflow.acceptUser(member);
            this.editButton(0, interaction);
            break;
          case 'button_deny':
            //ApplicationWorkflow.denyUser(member);
            this.editButton(1, interaction);

            break;
          case 'button_spa':
            //ApplicationWorkflow.spaTimeUser(member);
            this.editButton(2, interaction);

            break;
          default:
            console.log(`I don't know what button ${interaction.customId} is...`)
            break;
        }
      } catch (err) {
        console.log(err);

      } finally {
        // interaction.reply('.');
      }
    })

  }

  editButton(res, interaction) {
    let newColor = Colors.Yellow;
    let description = interaction.message.embeds[0].data.description;

    switch (res) {
      case 0: //accept
        newColor = Colors.Green;
        description = '**Application Accepted**\n' + description;
        break;
      case 1: //deny
        newColor = Colors.Red;
        description = '**Application Denied**\n' + description;

        break;
      case 2: //spa
        description = '**Spa time, mother fucker!**\n' + description;

        break;

      default:
        break;
    }

    const embed = new EmbedBuilder().setColor(newColor).setDescription(description);
    interaction.message.edit({ embeds: [embed] });
  }

}