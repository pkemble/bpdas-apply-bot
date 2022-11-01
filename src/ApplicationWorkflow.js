const { Client, Message, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, ChannelType, PermissionFlagsBits } = require("discord.js");
const ApplicationForm = require('./utils/structures/ApplicationForm');

/**
 * 
 * @param {String} memberId
 * @param {Array} guildConfigs 
 * @param {Message} message 
 * @returns
 */
const acceptUser = async (memberId, guildConfig, message) => {
    const newbRole = message.guild.roles.cache.find(r => r.id == guildConfig.newb_role_id);
    const acceptRole = message.guild.roles.cache.find(a => a.id == guildConfig.accepted_role_id);
    const member = await message.guild.members.fetch(memberId);
    if (!newbRole || !acceptRole) {
        message.channel.send('check your db roles, bro');
        return false;
    }

    try {
        member.roles.add(acceptRole);
        member.roles.remove(newbRole);
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        console.log(`${member} had roles changed`);
        return true;
    }

}

const denyUser = async (memberId, guildConfig, interaction) => {
    try {
        const member = interaction.guild.members.cache.get(memberId);
        member.kick({ reason: guildConfig.ban_reason })
        console.log(`denying ${member}`)

    } catch (err) {
        console.log(err)

    }
}

const spaTimeUser = async (memberId, guildConfig, interaction) => {
    try {
        console.log('spaTimeUser ran')
        //create a spa for the user
        const memberApplicationChannel = await interaction.guild.channels.fetch(guildConfig.application_log_channel_id);
        const spaUser = await interaction.guild.members.fetch(memberId)
        const spaChannelName = `🛌🏾・Spa for ${spaUser.displayName}`
        const spaChannel = await interaction.guild.channels.create({
            name: spaChannelName,
            type: ChannelType.GuildText,
            parent: guildConfig.spa_channel_category,
        })
        await spaChannel.permissionOverwrites.create(spaUser, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true })

        memberApplicationChannel.send(`${spaChannel} created for ${spaUser}`);
        spaChannel.send(`${spaUser}\n${guildConfig.spa_intro}`);

    } catch (err) {
        console.log(err);
    }

}
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {Array} answers 
 */
const submitApplication = async (client, message, answers) => {

    try {
        const applicant = client.users.cache.get(message.author.id);
        const guildConfig = client.configs.find(c => c.guild_id == message.guildId)
        const applicationForm = new ApplicationForm();
        applicationForm.applicantId = applicant.id;
        let finishedApplication = `${applicant} has submitted the following application: \n`;
        answers.forEach(a => {
            finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
            let que = a.question, ans = a.answer.content;
            applicationForm.addAnswer({ question: que, answer: ans });
        });
        applicationForm.saveToDatabase();

        const memberApplicationChannelId = guildConfig.application_log_channel_id;
        if (memberApplicationChannelId) {
            const memberApplicationChannel = client.channels.cache.get(memberApplicationChannelId);
            if (memberApplicationChannel) {

                const row = new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(`button_accept`)
                        .setLabel('accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`button_deny`)
                        .setLabel('deny')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`button_spa`)
                        .setLabel('spa time')
                        .setStyle(ButtonStyle.Primary)
                );

                const embed = new EmbedBuilder()
                    .setColor(Colors.Yellow)
                    .setDescription(finishedApplication)

                memberApplicationChannel.send({
                    // content: finishedApplication,
                    components: [row],
                    embeds: [embed],
                });

                client.on('interactionCreate', (interaction) => {
                    console.log(interaction);
                    const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
                    switch (interaction.customId) {
                        case 'button_accept':
                            acceptUser(memberId, guildConfig, interaction);
                            editButton(0, interaction);
                            break;
                        case 'button_deny':
                            denyUser(memberId, guildConfig, interaction);
                            editButton(1, interaction);
                            break;
                        case 'button_spa':
                            spaTimeUser(memberId, guildConfig, interaction);
                            editButton(2, interaction);
                            break;
                        default:
                            console.log(`I don't know what button ${interaction.customId} is...`)
                            break;
                    }

                })
            }
        }
    } catch (err) {
        console.log(err);
    } finally {
        //interaction.reply();
    }
}

const editButton = (res, interaction) => {
    let newColor = Colors.Yellow;
    let description = '';
    switch (res) {
        case 0: //accept
            newColor = Colors.Green;
            description += `\n\n**Application Accepted**\nby ${interaction.user} on ${new Date().toUTCString()}`;
            break;
        case 1: //deny
            newColor = Colors.Red;
            description += `\n\n**Application Denied**\nby ${interaction.user} on ${new Date().toUTCString()}`;
            break;
        case 2: //spa
            description += `\n\n**Spa time, mother fucker!**\nby ${interaction.user} on ${new Date().toUTCString()}`;
            break;
        default:
            break;
    }

    const embed = new EmbedBuilder().setColor(newColor).setDescription(description);
    interaction.message.edit({
        embeds: [
            interaction.message.embeds[0],
            embed
        ]
    });
}

module.exports = { acceptUser, denyUser, spaTimeUser, submitApplication, editButton };