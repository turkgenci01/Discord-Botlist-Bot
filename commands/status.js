const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Bot durumunu yönet')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Bot durumunu değiştir')
                .addStringOption(option =>
                    option.setName('durum')
                        .setDescription('Bot durumu')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟢 Çevrimiçi', value: 'online' },
                            { name: '🟡 Boşta', value: 'idle' },
                            { name: '🔴 Rahatsız Etmeyin', value: 'dnd' },
                            { name: '⚫ Görünmez', value: 'invisible' }
                        ))
                .addStringOption(option =>
                    option.setName('aktivite')
                        .setDescription('Aktivite türü')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎮 Oynuyor', value: 'playing' },
                            { name: '🎵 Dinliyor', value: 'listening' },
                            { name: '👀 İzliyor', value: 'watching' },
                            { name: '🏆 Yarışıyor', value: 'competing' },
                            { name: '🔴 Yayın Yapıyor', value: 'streaming' }
                        ))
                .addStringOption(option =>
                    option.setName('metin')
                        .setDescription('Aktivite metni')
                        .setRequired(true)
                        .setMaxLength(128))
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('Yayın URL\'si (sadece streaming için)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Mevcut bot durumunu göster'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Durumu .env ayarlarına sıfırla')),

    async execute(interaction) {
        // Yetki kontrolü
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
                flags: 64
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const statusManager = interaction.client.statusManager;

        if (subcommand === 'set') {
            const durum = interaction.options.getString('durum');
            const aktivite = interaction.options.getString('aktivite');
            const metin = interaction.options.getString('metin');
            const url = interaction.options.getString('url');

            // Streaming için URL kontrolü
            if (aktivite === 'streaming' && !url) {
                return interaction.reply({
                    embeds: [errorEmbed(
                        'URL Gerekli',
                        'Yayın durumu için geçerli bir Twitch/YouTube URL\'si gereklidir!'
                    )],
                    flags: 64
                });
            }

            const success = await statusManager.updateStatus(durum, aktivite, metin, url);

            if (success) {
                const statusEmojis = {
                    'online': '🟢',
                    'idle': '🟡', 
                    'dnd': '🔴',
                    'invisible': '⚫'
                };

                const activityEmojis = {
                    'playing': '🎮',
                    'listening': '🎵',
                    'watching': '👀',
                    'competing': '🏆',
                    'streaming': '🔴'
                };

                await interaction.reply({
                    embeds: [successEmbed(
                        'Durum Güncellendi',
                        `${statusEmojis[durum]} **Durum:** ${durum}\n${activityEmojis[aktivite]} **Aktivite:** ${aktivite}\n📝 **Metin:** ${metin}${url ? `\n🔗 **URL:** ${url}` : ''}`
                    )],
                    flags: 64
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed(
                        'Hata',
                        'Durum güncellenirken bir hata oluştu!'
                    )],
                    flags: 64
                });
            }

        } else if (subcommand === 'info') {
            const statusInfo = statusManager.getStatusInfo();
            const activity = statusInfo.activities[0];

            const statusEmojis = {
                'online': '🟢 Çevrimiçi',
                'idle': '🟡 Boşta',
                'dnd': '🔴 Rahatsız Etmeyin',
                'invisible': '⚫ Görünmez'
            };

            const activityNames = {
                0: '🎮 Oynuyor',
                1: '🔴 Yayın Yapıyor',
                2: '🎵 Dinliyor',
                3: '👀 İzliyor',
                4: '📝 Özel',
                5: '🏆 Yarışıyor'
            };

            const embed = new EmbedBuilder()
                .setTitle('🎭 Bot Durum Bilgisi')
                .setColor('#00aaff')
                .addFields(
                    { name: '📊 Durum', value: statusEmojis[statusInfo.status] || statusInfo.status, inline: true },
                    { name: '🎯 Aktivite', value: activity ? activityNames[activity.type] || 'Bilinmiyor' : 'Yok', inline: true },
                    { name: '📝 Metin', value: activity ? activity.name : 'Yok', inline: false }
                )
                .setFooter({ text: 'BotList Sistemi' })
                .setTimestamp();

            if (activity && activity.url) {
                embed.addFields({ name: '🔗 URL', value: activity.url, inline: false });
            }

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } else if (subcommand === 'reset') {
            const success = await statusManager.setStatus();

            if (success) {
                await interaction.reply({
                    embeds: [successEmbed(
                        'Durum Sıfırlandı',
                        'Bot durumu .env dosyasındaki ayarlara sıfırlandı!'
                    )],
                    flags: 64
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed(
                        'Hata',
                        'Durum sıfırlanırken bir hata oluştu!'
                    )],
                    flags: 64
                });
            }
        }
    }
};