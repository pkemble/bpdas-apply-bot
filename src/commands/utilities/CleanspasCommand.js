const BaseCommand = require('../../utils/structures/BaseCommand');
const { getCurrentConfig } = require('../../../client/client');
const { ModalBuilder, ActionRowBuilder, ButtonBuilder, Emoji, GuildEmoji, ButtonStyle, EmbedBuilder, Colors, InteractionCollector, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSpas } = require('../../utils/CleanSpasWorkflow');

module.exports = class CleanspasCommand extends BaseCommand {
  constructor() {
    super('cleanspas', 'utilities', []);
  }
  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Clean the spas category up')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON();
  }

  async run(client, interaction, args) {
    const guildConfig = client.configs.find(c => c.guild_id == interaction.guild.id);

    let spaStrings = '';
    let spaTitles = '';
    const spaArray = await getSpas(client, guildConfig);

    if (!spaArray || spaArray.size === 0) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
          .setTitle("Clean House?")
          .setDescription("There aren't any spas to delete, dear.")
          .setColor(Colors.DarkGold)
          
        ]
      });
    }

    for (const spa of spaArray) {
      spaStrings += `${spa[1]}\n`;
      spaTitles += `${spa[1].name}\n`;
    }

    const buttonRow = new ActionRowBuilder()
      .setComponents(
        new ButtonBuilder()
          .setCustomId('cleanspas_yes')
          .setEmoji("⚠️")
          .setLabel('Delete Spas')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cleanspas_cancel')
          .setEmoji("😏")
          .setLabel('Nevermind...')
          .setStyle(ButtonStyle.Secondary),
      );

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Clean house?')
      .setDescription(`(the Spa Channels, that is...)\n\nThis will devalue and discard the following channels:\n${spaStrings}`)

    interaction.channel.send({
      components: [buttonRow],
      embeds: [embed]
    });
  }
}