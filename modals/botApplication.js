const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addApplication, hasApplicationForBot } = require('../utils/botApplications');
const { applicationEmbed, successEmbed } = require('../utils/embeds');

module.exports = {
    name: 'bot',
    
    async execute(interaction) {
        if (interaction.customId === 'bot_application') {
            const botId = interaction.fields.getTextInputValue('bot_id');
            const prefix = interaction.fields.getTextInputValue('bot_prefix');
            const description = interaction.fields.getTextInputValue('bot_description');

            // Bot ID format kontrolü
            if (!/^\d{17,19}$/.test(botId)) {
                return interaction.reply({
                    content: '❌ Geçersiz Bot ID! Bot ID 17-19 haneli bir sayı olmalıdır.',
                    flags: 64 // InteractionResponseFlags.Ephemeral
                });
            }

            // Aynı bot için bekleyen başvuru var mı kontrol et
            if (hasApplicationForBot(botId)) {
                return interaction.reply({
                    content: '❌ Bu bot için zaten bekleyen bir başvuru bulunuyor!',
                    flags: 64
                });
            }

            // Bot zaten sunucuda ve onaylanmış mı kontrol et
            const guild = interaction.guild;
            const botMember = guild.members.cache.get(botId);
            if (botMember) {
                const botRole = guild.roles.cache.get(process.env.BOT_ROLE_ID);
                if (botRole && botMember.roles.cache.has(botRole.id)) {
                    return interaction.reply({
                        content: '❌ Bu bot zaten sunucuda onaylanmış durumda!',
                        flags: 64
                    });
                }
            }

            // Başvuru verisini oluştur
            const applicationData = {
                botId,
                prefix,
                description,
                applicantId: interaction.user.id,
                applicantTag: interaction.user.tag
            };

            // Başvuruyu kaydet
            const applicationId = addApplication(applicationData);

            // Onay kanalına başvuru gönder
            const approvalChannel = guild.channels.cache.get(process.env.ONAY_CHANNEL_ID);

            if (approvalChannel) {
                const embed = applicationEmbed(botId, prefix, description, interaction.user);
                embed.setFooter({ text: `Başvuru ID: ${applicationId}` });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`application_approve_${applicationId}`)
                            .setLabel('✅ Onayla')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`application_reject_${applicationId}`)
                            .setLabel('❌ Reddet')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`application_invite_${applicationId}`)
                            .setLabel('🔗 Botu Ekle')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await approvalChannel.send({
                    embeds: [embed],
                    components: [row]
                });
            }

            // Kullanıcıya onay mesajı
            const successMsg = successEmbed(
                'Başvuru Gönderildi!',
                `🎉 **${botId}** ID'li botunuz için başvuru başarıyla gönderildi!\n\n**Başvuru ID:** \`${applicationId}\`\n**Prefix:** \`${prefix}\`\n\n⏳ Başvurunuz yetkili ekibimiz tarafından incelenecek ve size bilgi verilecektir.`
            );

            await interaction.reply({
                embeds: [successMsg],
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }
    }
};