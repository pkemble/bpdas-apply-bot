const BaseCommand = require('../../utils/structures/BaseCommand');
const { getCurrentConfig } = require('../../../client/client');
const { ModalBuilder, ActionRowBuilder, ButtonBuilder, Emoji, GuildEmoji, ButtonStyle, EmbedBuilder, Colors, InteractionCollector } = require('discord.js');

module.exports = class CleanspasCommand extends BaseCommand {
  constructor() {
    super('cleanspas', 'utilities', []);
  }

  async run(client, message, args) {
    return;
    const guildConfig = client.configs.find(c => c.guild_id == message.guild.id);
    const spaCategoryId = guildConfig.spa_channel_category;
    let spaStrings = '';
    let spaTitles = '';
    const spaArray = message.guild.channels.cache.get(spaCategoryId).children.cache;

    if (!spaArray || spaArray.length === 0) {
      message.channel.send("No spas, bro.");
    }

    for (const spa of spaArray) {
      spaStrings += `${spa[1]}\n`;
      spaTitles += `${spa[1].name}\n`;
    }

    const buttonRow = new ActionRowBuilder()
      .setComponents(
        new ButtonBuilder()
          .setCustomId('yes')
          .setEmoji("⚠️")
          .setLabel('Delete Spas')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel')
          .setEmoji("😏")
          .setLabel('Nevermind...')
          .setStyle(ButtonStyle.Secondary),
      );

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Clean house?')
      .setDescription(`(the Spa Channels, that is...)\n\nThis will devalue and discard the following channels:\n${spaStrings}`)

    message.channel.send({
      components: [buttonRow],
      embeds: [embed]
    });

    client.on("interactionCreate", async interaction => {
      try {
        if (interaction.customId == "yes") {
          for (const spa of spaArray) {
            await spa[1].delete();
          }
          const deletedEmbed = new EmbedBuilder()
            .setTitle('House Cleaned.')
            .setDescription(`:mong_norepto: -  I deleted ${spaArray.size} spas:\n${spaTitles}`)
            .setColor(Colors.Red);
          await interaction.message.edit({
            embeds: [
              deletedEmbed,
            ]
          });
        } else {
          const cancelledEmbed = new EmbedBuilder()
            .setDescription(`Cancelled by ${interaction.user}!`)
            .setColor(Colors.DarkGold);
          await interaction.message.edit({
            embeds: [
              interaction.message.embeds[0],
              cancelledEmbed,
            ]
          });
        }
      } catch (error) {
        console.log(error)
      } finally {
        await interaction.message.edit({
          components: [],
        })
        //await interaction.deferUpdate();
      }
    })

  }
}