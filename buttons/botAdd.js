const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'bot',
    
    async execute(interaction) {
        if (interaction.customId === 'bot_add') {
            const modal = new ModalBuilder()
                .setCustomId('bot_application')
                .setTitle('🤖 Bot Başvuru Formu');

            const botIdInput = new TextInputBuilder()
                .setCustomId('bot_id')
                .setLabel('Bot ID')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Bot ID\'sini buraya yazın (örn: 123456789012345678)')
                .setRequired(true)
                .setMinLength(17)
                .setMaxLength(19);

            const prefixInput = new TextInputBuilder()
                .setCustomId('bot_prefix')
                .setLabel('Bot Prefix')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Botunuzun prefix\'ini yazın (örn: !, ?, /)')
                .setRequired(true)
                .setMaxLength(5);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('bot_description')
                .setLabel('Bot Açıklaması')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Botunuz hakkında kısa bir açıklama yazın...')
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(500);

            const firstActionRow = new ActionRowBuilder().addComponents(botIdInput);
            const secondActionRow = new ActionRowBuilder().addComponents(prefixInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);

            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

            await interaction.showModal(modal);
        }
    }
};