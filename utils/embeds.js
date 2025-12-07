const { EmbedBuilder } = require('discord.js');

module.exports = {
    // Bot ekleme ana embed'i
    botAddEmbed: () => {
        return new EmbedBuilder()
            .setTitle('🤖 Bot Listesine Ekle')
            .setDescription('Botunuzu sunucumuza eklemek için aşağıdaki butona tıklayın ve formu doldurun.')
            .setColor('#00ff88')
            .addFields(
                { name: '📋 Gereksinimler', value: '• Bot ID\n• Prefix\n• Açıklama', inline: true },
                { name: '⏱️ İşlem Süresi', value: 'Ortalama 24 saat', inline: true },
                { name: '✅ Onay Kriterleri', value: '• Zararlı olmayan\n• Çalışır durumda\n• Sunucu kurallarına uygun', inline: false }
            )
            .setFooter({ text: 'BotList Sistemi | Geliştirildi ❤️ ile' })
            .setTimestamp();
    },

    // Başvuru embed'i (onay kanalı için)
    applicationEmbed: (botId, prefix, description, applicant) => {
        return new EmbedBuilder()
            .setTitle('🆕 Yeni Bot Başvurusu')
            .setColor('#ffaa00')
            .addFields(
                { name: '🤖 Bot ID', value: `\`${botId}\``, inline: true },
                { name: '🏷️ Prefix', value: `\`${prefix}\``, inline: true },
                { name: '👤 Başvuran', value: `${applicant}`, inline: true },
                { name: '📝 Açıklama', value: description || 'Açıklama belirtilmedi.', inline: false }
            )
            .setFooter({ text: 'Başvuru ID: ' })
            .setTimestamp();
    },

    // Onay embed'i
    approvedEmbed: (botName, botId, owner) => {
        return new EmbedBuilder()
            .setTitle('✅ Bot Onaylandı')
            .setColor('#00ff00')
            .addFields(
                { name: '🤖 Bot', value: `${botName} (\`${botId}\`)`, inline: true },
                { name: '👤 Sahibi', value: `${owner}`, inline: true },
                { name: '📅 Onay Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'BotList Sistemi' })
            .setTimestamp();
    },

    // Red embed'i
    rejectedEmbed: (botId, reason, staff) => {
        return new EmbedBuilder()
            .setTitle('❌ Bot Reddedildi')
            .setColor('#ff0000')
            .addFields(
                { name: '🤖 Bot ID', value: `\`${botId}\``, inline: true },
                { name: '👮 Yetkili', value: `${staff}`, inline: true },
                { name: '📝 Red Sebebi', value: reason, inline: false },
                { name: '📅 Red Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'BotList Sistemi' })
            .setTimestamp();
    },

    // Başarı embed'i
    successEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setColor('#00ff00')
            .setTimestamp();
    },

    // Hata embed'i
    errorEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setColor('#ff0000')
            .setTimestamp();
    }
};