const { ActivityType } = require('discord.js');

class StatusManager {
    constructor(client) {
        this.client = client;
        this.statusTypes = {
            'online': 'online',
            'idle': 'idle', 
            'dnd': 'dnd',
            'invisible': 'invisible'
        };
        
        this.activityTypes = {
            'playing': ActivityType.Playing,
            'streaming': ActivityType.Streaming,
            'listening': ActivityType.Listening,
            'watching': ActivityType.Watching,
            'custom': ActivityType.Custom,
            'competing': ActivityType.Competing
        };
    }

    async setStatus() {
        try {
            const statusType = process.env.BOT_STATUS_TYPE || 'online';
            const activityType = process.env.BOT_ACTIVITY_TYPE || 'watching';
            const activityText = process.env.BOT_ACTIVITY_TEXT || 'BotList Sistemi | /setup';
            const statusUrl = process.env.BOT_STATUS_URL || null;

            // Durum tipini kontrol et
            const validStatus = this.statusTypes[statusType.toLowerCase()] || 'online';
            
            // Aktivite tipini kontrol et
            const validActivityType = this.activityTypes[activityType.toLowerCase()] || ActivityType.Watching;

            // Aktivite objesi oluştur
            const activity = {
                name: activityText,
                type: validActivityType
            };

            // Eğer streaming ise URL ekle
            if (validActivityType === ActivityType.Streaming && statusUrl) {
                activity.url = statusUrl;
            }

            // Durumu ayarla
            await this.client.user.setPresence({
                status: validStatus,
                activities: [activity]
            });

            console.log(`🎭 Bot durumu ayarlandı: ${validStatus} | ${activityType}: ${activityText}`);
            return true;

        } catch (error) {
            console.error('❌ Bot durumu ayarlanırken hata:', error);
            return false;
        }
    }

    // Durum bilgilerini getir
    getStatusInfo() {
        const presence = this.client.user.presence;
        return {
            status: presence.status,
            activities: presence.activities.map(activity => ({
                name: activity.name,
                type: activity.type,
                url: activity.url || null
            }))
        };
    }

    // Mevcut durum türlerini listele
    getAvailableStatuses() {
        return {
            statusTypes: Object.keys(this.statusTypes),
            activityTypes: Object.keys(this.activityTypes)
        };
    }

    // Dinamik durum değiştirme
    async updateStatus(statusType, activityType, activityText, statusUrl = null) {
        try {
            const validStatus = this.statusTypes[statusType.toLowerCase()] || 'online';
            const validActivityType = this.activityTypes[activityType.toLowerCase()] || ActivityType.Watching;

            const activity = {
                name: activityText,
                type: validActivityType
            };

            if (validActivityType === ActivityType.Streaming && statusUrl) {
                activity.url = statusUrl;
            }

            await this.client.user.setPresence({
                status: validStatus,
                activities: [activity]
            });

            return true;
        } catch (error) {
            console.error('❌ Durum güncellenirken hata:', error);
            return false;
        }
    }
}

module.exports = StatusManager;