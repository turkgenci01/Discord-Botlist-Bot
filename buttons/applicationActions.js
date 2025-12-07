const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { getApplication, updateApplicationStatus, deleteApplication } = require('../utils/botApplications');
const { approvedEmbed, rejectedEmbed, successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
    name: 'application',
    
    async execute(interaction) {
        const [, action, applicationId] = interaction.customId.split('_');
        const application = getApplication(parseInt(applicationId));
        
        if (!application) {
            return interaction.reply({
                content: '❌ Başvuru bulunamadı!',
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }

        const guild = interaction.guild;
        const logChannel = guild.channels.cache.get(process.env.BOT_LOG_CHANNEL_ID);

        if (action === 'approve') {
            // Bot sunucuda var mı kontrol et
            const botMember = guild.members.cache.get(application.botId);
            if (!botMember) {
                return interaction.reply({
                    content: '❌ Bot sunucuda bulunamadı! Önce botu sunucuya ekleyin.',
                    flags: 64 // InteractionResponseFlags.Ephemeral
                });
            }

            // Bot zaten onaylanmış mı kontrol et
            const botRole = guild.roles.cache.get(process.env.BOT_ROLE_ID);
            if (botRole && botMember.roles.cache.has(botRole.id)) {
                return interaction.reply({
                    content: '❌ Bu bot zaten onaylanmış!',
                    flags: 64
                });
            }

            try {
                // Bot rolü ver
                if (botRole) {
                    await botMember.roles.add(botRole);
                }

                // Sahibe owner rolü ver
                const ownerMember = guild.members.cache.get(application.applicantId);
                if (ownerMember) {
                    const ownerRole = guild.roles.cache.get(process.env.OWNER_ROLE_ID);
                    if (ownerRole) {
                        await ownerMember.roles.add(ownerRole);
                    }

                    // Nickname değiştir - Kullanıcı adı [Bot adı] formatında
                    try {
                        const originalUsername = ownerMember.user.username;
                        const newNickname = `${originalUsername} [${botMember.user.username}]`;
                        await ownerMember.setNickname(newNickname);
                    } catch (nicknameError) {
                        console.log('Nickname değiştirilemedi:', nicknameError.message);
                    }
                }

                // Başvuru durumunu güncelle
                updateApplicationStatus(parseInt(applicationId), 'approved');

                // Log kanalına bildirim gönder
                const logEmbed = approvedEmbed(
                    botMember.user.username,
                    application.botId,
                    `<@${application.applicantId}>`
                );

                if (logChannel) {
                    await logChannel.send({ embeds: [logEmbed] });
                }

                // Kullanıcıya DM gönder
                try {
                    const applicant = await interaction.client.users.fetch(application.applicantId);
                    await applicant.send({
                        embeds: [successEmbed(
                            'Bot Onaylandı!',
                            `🎉 **${botMember.user.username}** adlı botunuz başarıyla onaylandı!\n\n**Bot ID:** \`${application.botId}\`\n**Prefix:** \`${application.prefix}\``
                        )]
                    });
                } catch (error) {
                    console.log('DM gönderilemedi:', error.message);
                }

                // Başvuru mesajını güncelle
                const approvedEmbedMsg = new EmbedBuilder()
                    .setTitle('✅ Bot Onaylandı')
                    .setColor('#00ff00')
                    .addFields(
                        { name: '🤖 Bot', value: `${botMember.user.username} (\`${application.botId}\`)`, inline: true },
                        { name: '👤 Sahibi', value: `<@${application.applicantId}>`, inline: true },
                        { name: '👮 Onaylayan', value: `${interaction.user}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.update({
                    embeds: [approvedEmbedMsg],
                    components: []
                });

                // Başvuruyu sil
                deleteApplication(parseInt(applicationId));

            } catch (error) {
                console.error('Onay hatası:', error);
                
                const errorMessage = { 
                    content: '❌ Onay işlemi sırasında bir hata oluştu!', 
                    flags: 64 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }

        } else if (action === 'reject') {
            // Red sebebi modal'ı
            const modal = new ModalBuilder()
                .setCustomId(`reject_reason_${applicationId}`)
                .setTitle('❌ Bot Reddet');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reject_reason')
                .setLabel('Red Sebebi')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Botun reddedilme sebebini açıklayın...')
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(500);

            const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);

        } else if (action === 'invite') {
            // Bot invite linki oluştur
            const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${application.botId}&permissions=8&scope=bot%20applications.commands`;
            
            const inviteEmbed = new EmbedBuilder()
                .setTitle('🔗 Bot Davet Linki')
                .setDescription(`**${application.botId}** ID'li botu sunucuya eklemek için aşağıdaki bağlantıyı kullanın.`)
                .setColor('#00aaff')
                .addFields(
                    { name: '🤖 Bot ID', value: `\`${application.botId}\``, inline: true },
                    { name: '🏷️ Prefix', value: `\`${application.prefix}\``, inline: true }
                )
                .setTimestamp();

            const inviteRow = new ActionRowBuilder()
                .addComponents(
                    new (require('discord.js').ButtonBuilder)()
                        .setURL(inviteLink)
                        .setLabel('🤖 Botu Sunucuya Ekle')
                        .setStyle(require('discord.js').ButtonStyle.Link)
                );

            await interaction.reply({
                embeds: [inviteEmbed],
                components: [inviteRow],
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }
    }
};