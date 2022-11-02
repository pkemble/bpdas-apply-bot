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

        await memberApplicationChannel.send(`${spaChannel} created for ${spaUser}`);
        await spaChannel.send(`${spaUser}\n${guildConfig.spa_intro}`);

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
                        .setCustomId(`button_accept_${applicationForm.date}`)
                        .setLabel('accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`button_deny_${applicationForm.date}`)
                        .setLabel('deny')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`button_spa_${applicationForm.date}`)
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

                client.on('interactionCreate', async interaction => {
                    try {
                        //console.log(interaction);
                        const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
                        switch (interaction.customId) {
                            case `button_accept_${applicationForm.date}`:
                                await acceptUser(memberId, guildConfig, interaction);
                                await editButton(0, interaction);
                                break;
                            case `button_deny_${applicationForm.date}`:
                                await denyUser(memberId, guildConfig, interaction);
                                await editButton(1, interaction);
                                break;
                            case `button_spa_${applicationForm.date}`:
                                await spaTimeUser(memberId, guildConfig, interaction);
                                await editButton(2, interaction);
                                break;
                            default:
                                console.log(`I don't know what button ${interaction.customId} is...`)
                                break;
                        }
                    } catch (error) {
                        console.log(error);
                    } finally {
                        if (!interaction.deferred && !interaction.replied) {
                            try {
                                await interaction.deferUpdate();
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    }
                })
            }
        }
    } catch (err) {
        console.log(err);
    } finally {
    }
}

const editButton = async (res, interaction) => {
    let options = {};
    const appText = interaction.message.embeds[0].data.description;
    switch (res) {
        case 0: //accept
            const acceptEmbeds = new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`${appText}\n\n**Application Accepted**\nby ${interaction.user} on ${new Date().toUTCString()}`)

            options = {
                embeds: [acceptEmbeds],
                components: []
            }

            break;
        case 1: //deny
            const denyEmbeds = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`${appText}\n\n**Application Denied**\nby ${interaction.user} on ${new Date().toUTCString()}`)
            options = {
                embeds: [denyEmbeds],
                components: []
            }
            break;
        case 2: //spa
            const spaEmbeds = new EmbedBuilder()
                .setColor(Colors.DarkGold)
                .setDescription(`${appText}\n\n**Spa time, mother fucker!**\nby ${interaction.user} on ${new Date().toUTCString()}`)

            options = {
                embeds: [spaEmbeds],
                components: [
                    interaction.message.components[0]
                ]
            }
            break;
        default:
            break;
    }
    console.log(`Updating interaction with message options\n${JSON.stringify(options)}`)
    await interaction.message.edit(options);
    //await interaction.deferUpdate();
}

module.exports = { acceptUser, denyUser, spaTimeUser, submitApplication, editButton };