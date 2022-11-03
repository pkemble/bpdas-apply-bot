const { EmbedBuilder, Colors } = require("discord.js");

const cleanSpas = async (client, interaction, guildConfig) => {

  try {
    if (interaction.customId == "cleanspas_yes") {
      const spaArray = await getSpas(client, guildConfig);
      let spaTitles = '';
      for (const spa of spaArray) {
        spaTitles += `${spa[1].name}\n`;
        await spa[1].delete();
      }
      const deletedEmbed = new EmbedBuilder()
        .setTitle('House Cleaned.')
        .setDescription(`:mong_norepto: -  ${interaction.user} deleted ${spaArray.size} spas:\n${spaTitles}`)
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
    await interaction.deferUpdate();
  }
}

const getSpas = async (client, guildConfig) => {
  const spaCategoryId = guildConfig.spa_channel_category;
  try {
    const currentGuild = await client.guilds.cache.find(c => c.id == guildConfig.guild_id);

    const spaArray = currentGuild.channels.cache.get(spaCategoryId).children.cache;
    if (spaArray && spaArray.size > 0) {
      return spaArray;
    }

  } catch (error) {
    console.log(error);
  }
}
module.exports = { cleanSpas, getSpas };