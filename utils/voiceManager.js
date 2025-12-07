const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

class VoiceManager {
    constructor(client) {
        this.client = client;
        this.connection = null;
        this.player = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 saniye
        this.isConnecting = false;
    }

    async joinChannel(channelId = null) {
        if (this.isConnecting) {
            console.log('🔄 Zaten bağlanma işlemi devam ediyor...');
            return false;
        }

        try {
            this.isConnecting = true;
            const targetChannelId = channelId || process.env.VOICE_CHANNEL_ID;
            
            if (!targetChannelId) {
                console.log('❌ Ses kanalı ID\'si bulunamadı!');
                return false;
            }

            const channel = this.client.channels.cache.get(targetChannelId);
            if (!channel) {
                console.log('❌ Ses kanalı bulunamadı!');
                return false;
            }

            if (channel.type !== 2) { // GUILD_VOICE = 2
                console.log('❌ Belirtilen kanal bir ses kanalı değil!');
                return false;
            }

            // Mevcut bağlantıyı temizle
            if (this.connection) {
                this.connection.destroy();
            }

            console.log(`🔊 Ses kanalına bağlanılıyor: ${channel.name}`);

            this.connection = joinVoiceChannel({
                channelId: targetChannelId,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            // Bağlantı event'lerini ayarla
            this.setupConnectionEvents();

            // Player oluştur
            if (!this.player) {
                this.player = createAudioPlayer();
                this.setupPlayerEvents();
            }

            // Player'ı bağlantıya subscribe et
            this.connection.subscribe(this.player);

            this.reconnectAttempts = 0;
            console.log(`✅ Ses kanalına başarıyla bağlanıldı: ${channel.name}`);
            return true;

        } catch (error) {
            console.error('❌ Ses kanalına bağlanırken hata:', error.message);
            
            // WebContainer specific hatalar için özel handling
            if (error.message.includes('getAsyncId') || error.message.includes('UND_ERR_SOCKET')) {
                console.log('⚠️ WebContainer ortamında ses bağlantısı sınırlı olabilir');
                // Hata olsa bile bağlantı objesi oluşturmaya çalış
                try {
                    const channel = this.client.channels.cache.get(channelId || process.env.VOICE_CHANNEL_ID);
                    if (channel) {
                        console.log(`🔄 Alternatif bağlantı deneniyor: ${channel.name}`);
                        // Basit bir timeout ile tekrar dene
                        setTimeout(() => this.retryConnection(channelId), 3000);
                    }
                } catch (retryError) {
                    console.log('❌ Alternatif bağlantı da başarısız');
                }
            }
            
            return false;
        } finally {
            this.isConnecting = false;
        }
    }

    async retryConnection(channelId = null) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Maksimum yeniden bağlanma denemesi aşıldı');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        await this.joinChannel(channelId);
    }

    setupConnectionEvents() {
        if (!this.connection) return;

        this.connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('🎵 Ses bağlantısı hazır!');
        });

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log('🔌 Ses bağlantısı kesildi, yeniden bağlanılıyor...');
            
            try {
                await Promise.race([
                    new Promise(resolve => this.connection.once(VoiceConnectionStatus.Signalling, resolve)),
                    new Promise(resolve => this.connection.once(VoiceConnectionStatus.Connecting, resolve)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                ]);
            } catch (error) {
                console.log('⚠️ Otomatik yeniden bağlanma başarısız, manuel deneme yapılıyor...');
                this.retryConnection();
            }
        });

        this.connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('💥 Ses bağlantısı yok edildi');
            this.connection = null;
        });

        this.connection.on('error', (error) => {
            console.error('❌ Ses bağlantısı hatası:', error.message);
            if (!error.message.includes('getAsyncId')) {
                this.retryConnection();
            }
        });
    }

    setupPlayerEvents() {
        if (!this.player) return;

        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log('▶️ Ses çalınıyor');
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log('⏸️ Ses durdu');
        });

        this.player.on('error', (error) => {
            console.error('❌ Audio player hatası:', error.message);
        });
    }

    leaveChannel() {
        try {
            if (this.connection) {
                this.connection.destroy();
                this.connection = null;
                console.log('👋 Ses kanalından ayrıldı');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Ses kanalından ayrılırken hata:', error.message);
            return false;
        }
    }

    getConnectionStatus() {
        if (!this.connection) {
            return {
                connected: false,
                status: 'Bağlı değil',
                channelId: null,
                channelName: null
            };
        }

        const channelId = this.connection.joinConfig.channelId;
        const channel = this.client.channels.cache.get(channelId);

        return {
            connected: this.connection.state.status === VoiceConnectionStatus.Ready,
            status: this.connection.state.status,
            channelId: channelId,
            channelName: channel ? channel.name : 'Bilinmiyor',
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Bot başladığında otomatik bağlan
    async autoConnect() {
        const voiceChannelId = process.env.VOICE_CHANNEL_ID;
        if (voiceChannelId) {
            console.log('🔄 Otomatik ses kanalı bağlantısı başlatılıyor...');
            // 3 saniye bekle sonra bağlan
            setTimeout(() => {
                this.joinChannel(voiceChannelId);
            }, 3000);
        }
    }

    // Periyodik bağlantı kontrolü
    startHealthCheck() {
        setInterval(() => {
            const status = this.getConnectionStatus();
            if (!status.connected && process.env.VOICE_CHANNEL_ID) {
                console.log('🔍 Ses bağlantısı kontrol ediliyor...');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.joinChannel();
                }
            }
        }, 30000); // 30 saniyede bir kontrol et
    }
}

module.exports = VoiceManager;