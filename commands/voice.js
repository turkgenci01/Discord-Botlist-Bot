const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Ses kanalı yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Belirlenen ses kanalına bağlan')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Bağlanılacak ses kanalı (boş bırakırsa .env\'deki kanal)')
                        .setRequired(false)
                        .addChannelTypes(2))) // GUILD_VOICE
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Ses kanalından ayrıl'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Ses bağlantısı durumunu göster'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reconnect')
                .setDescription('Ses bağlantısını yeniden başlat')),

    async execute(interaction) {
        // Yetki kontrolü
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
                flags: 64
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const voiceManager = interaction.client.voiceManager;

        if (subcommand === 'join') {
            const channel = interaction.options.getChannel('kanal');
            const channelId = channel ? channel.id : null;

            // Kanal türü kontrolü
            if (channel && channel.type !== 2) {
                return interaction.reply({
                    embeds: [errorEmbed(
                        'Geçersiz Kanal',
                        'Lütfen bir ses kanalı seçin!'
                    )],
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            const success = await voiceManager.joinChannel(channelId);
            const status = voiceManager.getConnectionStatus();

            if (success || status.connected) {
                await interaction.editReply({
                    embeds: [successEmbed(
                        'Ses Kanalına Bağlanıldı',
                        `🔊 **${status.channelName}** kanalına başarıyla bağlanıldı!\n\n📊 **Durum:** ${status.status}\n🆔 **Kanal ID:** \`${status.channelId}\``
                    )]
                });
            } else {
                await interaction.editReply({
                    embeds: [errorEmbed(
                        'Bağlantı Hatası',
                        '❌ Ses kanalına bağlanırken bir hata oluştu!\n\n💡 **İpucu:** .env dosyasında VOICE_CHANNEL_ID ayarlandığından emin olun.'
                    )]
                });
            }

        } else if (subcommand === 'leave') {
            const success = voiceManager.leaveChannel();

            if (success) {
                await interaction.reply({
                    embeds: [successEmbed(
                        'Ses Kanalından Ayrıldı',
                        '👋 Ses kanalından başarıyla ayrıldı!'
                    )],
                    flags: 64
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed(
                        'Hata',
                        '❌ Zaten ses kanalında değilim!'
                    )],
                    flags: 64
                });
            }

        } else if (subcommand === 'status') {
            const status = voiceManager.getConnectionStatus();

            const statusEmojis = {
                'ready': '🟢 Bağlı',
                'connecting': '🟡 Bağlanıyor',
                'disconnected': '🔴 Bağlantı Kesildi',
                'destroyed': '⚫ Yok Edildi',
                'signalling': '🟠 Sinyal Gönderiliyor'
            };

            const embed = new EmbedBuilder()
                .setTitle('🔊 Ses Bağlantısı Durumu')
                .setColor(status.connected ? '#00ff00' : '#ff0000')
                .addFields(
                    { name: '📊 Durum', value: statusEmojis[status.status] || status.status, inline: true },
                    { name: '🔗 Bağlı', value: status.connected ? '✅ Evet' : '❌ Hayır', inline: true },
                    { name: '📍 Kanal', value: status.channelName || 'Yok', inline: true }
                )
                .setTimestamp();

            if (status.channelId) {
                embed.addFields({ name: '🆔 Kanal ID', value: `\`${status.channelId}\``, inline: true });
            }

            if (status.reconnectAttempts > 0) {
                embed.addFields({ name: '🔄 Yeniden Bağlanma', value: `${status.reconnectAttempts} deneme`, inline: true });
            }

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } else if (subcommand === 'reconnect') {
            await interaction.deferReply({ flags: 64 });

            // Mevcut bağlantıyı kes
            voiceManager.leaveChannel();
            
            // 2 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Yeniden bağlan
            const success = await voiceManager.joinChannel();
            const status = voiceManager.getConnectionStatus();

            if (success || status.connected) {
                await interaction.editReply({
                    embeds: [successEmbed(
                        'Bağlantı Yenilendi',
                        `🔄 Ses bağlantısı başarıyla yenilendi!\n\n📍 **Kanal:** ${status.channelName}\n📊 **Durum:** ${status.status}`
                    )]
                });
            } else {
                await interaction.editReply({
                    embeds: [errorEmbed(
                        'Yenileme Hatası',
                        '❌ Ses bağlantısı yenilenirken bir hata oluştu!'
                    )]
                });
            }
        }
    }
};