const { Column, Entity, PrimaryGeneratedColumn } = require('typeorm');

@Entity({ name: 'guild_configurations' })
export class GuildConfiguration {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, name: 'guild_id' })
    guildId: string;

    @Column({ default '/apply ' })
    prefix: string;

    @Column({ name: 'welcome_channel_id' })
    welcomeChannelId: string;
}