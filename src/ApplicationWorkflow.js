const { Client, Message, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember } = require("discord.js");
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

const denyUser = async (memberId, interaction) => {
    console.log('denyUser ran')
    return true;
}

const spaTimeUser = async (memberId, guildConfig, interaction) => {
    try {
        console.log('spaTimeUser ran')
        //find a free spa from the spa array
        const memberApplicationChannel = await interaction.guild.channels.fetch(guildConfig.application_log_channel_id);
        const spaUser = await interaction.guild.members.fetch(memberId)
        for (const spa of guildConfig.spa_channel_array.split(',')) {
            let spaChannel = await interaction.guild.channels.fetch(spa);
            await spaChannel.messages.fetch(); //refresh cache
            if (spaChannel && spaChannel.messages.cache.size == 0) {
                console.log(`found a clean spa: ${spaChannel}`);
                //add the user to it
                spaChannel.permissionOverwrites.create(spaUser, {ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true})
                //send a welcome message in the spa
                spaChannel.send(`${spaUser}:\n\n${guildConfig.spa_intro}`);
                //tag mods in the application logs
                memberApplicationChannel.send(`hey guys, got a live one in ${spaChannel}`);
                return;
            }
        }

        memberApplicationChannel.send(`I couldn't find an open spa for ${spaUser}\nMaybe my code was written too late at night and too passive aggressively :(`);
        

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
                try {
                    const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
                    switch (interaction.customId) {
                        case 'button_accept':
                            acceptUser(memberId, guildConfig, interaction);
                            editButton(0, interaction);
                            break;
                        case 'button_deny':
                            denyUser(memberId, interaction);
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
                } catch (err) {
                    console.log(err);

                } finally {
                    //interaction.reply();
                }
            })
        }
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