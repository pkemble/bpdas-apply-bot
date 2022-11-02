const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, EmbedBuilder, GuildMemberManager, Colors, Embed, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ApplicationWorkflow = require('../../ApplicationWorkflow');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class TacceptCommand extends BaseCommand {
  constructor() {
    super('taccept', 'test', []);
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Send a test application')
      // .addUserOption((option) => option.setName('user').setDescription('Tagged target user').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON();
  }

  async run(client, message, args) {
    const guildConfig = client.configs.find(c => c.guild_id == message.guildId)

    const testId = "1035972676482760737" //testdoc
    const testDescription = `<@1035972676482760737> has submitted the following application:    How old are you?:    46        How did you find this server? If a member invited you, please list the member's name and the app/website where you received the invitation.:    foo        Who has BPD (relationship), and is it diagnosed or undiagnosed?:    sii        Nulla porttitor accumsan tincidunt. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus suscipit tortor eget felis porttitor volutpat. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Curabitur aliquet quam id dui posuere blandit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus suscipit tortor eget felis porttitor volutpat. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Pellentesque in ipsum id orci porta dapibus. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Nulla quis lorem ut libero malesuada feugiat. How old are you?:    46        How did you find this server? If a member invited you, please list the member's name and the app/website where you received the invitation.:    foo        Who has BPD (relationship), and is it diagnosed or undiagnosed?:    sii        Nulla porttitor accumsan tincidunt. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus suscipit tortor eget felis porttitor volutpat. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Curabitur aliquet quam id dui posuere blandit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus suscipit tortor eget felis porttitor volutpat. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Pellentesque in ipsum id orci porta dapibus. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Nulla quis lorem ut libero malesuada feugiat.`
    const testUser = await message.guild.members.fetch(testId);
    const row = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId(`button_accept_${testUser.id}`)
        .setLabel('accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`button_deny_${testUser.id}`)
        .setLabel('deny')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`button_spa_${testUser.id}`)
        .setLabel('spa time')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0x0234FF)
      .setDescription(testDescription)

    message.channel.send({
      components: [row],
      embeds: [embed],
    });

    client.on('interactionCreate', async interaction => {
      console.log(interaction);
      await this.processButtons(interaction, guildConfig, testUser).then( async () => {
        await interaction.deferUpdate()
      });
    })
  }

  async processButtons(interaction, guildConfig, testUser) {
    try {
      const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
      switch (interaction.customId) {
        case `button_accept_${testUser.id}`:
          ApplicationWorkflow.acceptUser(memberId, guildConfig, interaction);
          ApplicationWorkflow.editButton(0, interaction);
          break;
        case `button_deny_${testUser.id}`:
          ApplicationWorkflow.denyUser(memberId, guildConfig, interaction);
          ApplicationWorkflow.editButton(1, interaction);

          break;
        case `button_spa_${testUser.id}`:
          await ApplicationWorkflow.spaTimeUser(memberId, guildConfig, interaction)
          await ApplicationWorkflow.editButton(2, interaction)
          if(!interaction.deferred || !interaction.replied) {
            await interaction.deferUpdate();
          }
          break;
        default:
          console.log(`I don't know what button ${interaction.customId} is...`)
          break;
      }
    } catch (err) {
      console.log(err);
    } finally {
      // interaction.deferUpdate()
    }

  }
}