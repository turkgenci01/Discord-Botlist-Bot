const { EmbedBuilder } = require('discord.js');
const { getApplication, updateApplicationStatus, deleteApplication } = require('../utils/botApplications');
const { rejectedEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
    name: 'reject',
    
    async execute(interaction) {
        const [, , applicationId] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('reject_reason');
        
        const application = getApplication(parseInt(applicationId));
        
        if (!application) {
            return interaction.reply({
                content: '❌ Başvuru bulunamadı!',
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }

        try {
            // Başvuru durumunu güncelle
            updateApplicationStatus(parseInt(applicationId), 'rejected');

            const guild = interaction.guild;
            const logChannel = guild.channels.cache.get(process.env.BOT_LOG_CHANNEL_ID);

            // Log kanalına bildirim gönder
            const logEmbed = rejectedEmbed(
                application.botId,
                reason,
                interaction.user
            );

            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

            // Kullanıcıya DM gönder
            try {
                const applicant = await interaction.client.users.fetch(application.applicantId);
                await applicant.send({
                    embeds: [errorEmbed(
                        'Bot Reddedildi',
                        `😔 **${application.botId}** ID'li botunuz için yaptığınız başvuru reddedildi.\n\n**Red Sebebi:** ${reason}\n\n💡 Sorunları giderdikten sonra tekrar başvurabilirsiniz.`
                    )]
                });
            } catch (error) {
                console.log('DM gönderilemedi:', error.message);
            }

            // Başvuru mesajını güncelle
            const rejectedEmbedMsg = new EmbedBuilder()
                .setTitle('❌ Bot Reddedildi')
                .setColor('#ff0000')
                .addFields(
                    { name: '🤖 Bot ID', value: `\`${application.botId}\``, inline: true },
                    { name: '👤 Başvuran', value: `<@${application.applicantId}>`, inline: true },
                    { name: '👮 Reddeden', value: `${interaction.user}`, inline: true },
                    { name: '📝 Red Sebebi', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.update({
                embeds: [rejectedEmbedMsg],
                components: []
            });

            // Başvuruyu sil
            deleteApplication(parseInt(applicationId));

        } catch (error) {
            console.error('Red işlemi hatası:', error);
            
            const errorMessage = { 
                content: '❌ Red işlemi sırasında bir hata oluştu!', 
                flags: 64 
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};