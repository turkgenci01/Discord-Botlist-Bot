const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { botAddEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('BotList sistemini kurulum yapar'),

    async execute(interaction) {
        // Yetki kontrolü (sadece yöneticiler kullanabilir)
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }

        const embed = botAddEmbed();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bot_add')
                    .setLabel('🤖 Bot Ekle')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('➕')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};