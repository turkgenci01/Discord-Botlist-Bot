const { Client, GatewayIntentBits, Collection } = require('discord.js');
const StatusManager = require('./utils/statusManager');
const VoiceManager = require('./utils/voiceManager');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Collections
client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.statusManager = new StatusManager(client);
client.voiceManager = new VoiceManager(client);

// Handlers
const loadHandlers = () => {
    const handlerFiles = fs.readdirSync('./handlers').filter(file => file.endsWith('.js'));
    
    for (const file of handlerFiles) {
        const handler = require(`./handlers/${file}`);
        handler(client);
        console.log(`✅ Handler yüklendi: ${file}`);
    }
};

client.once('ready', async () => {
    console.log(`🚀 Bot ${client.user.tag} olarak giriş yaptı!`);
    
    // Bot durumunu ayarla
    await client.statusManager.setStatus();
    
    // Ses kanalına otomatik bağlan
    await client.voiceManager.autoConnect();
    
    // Ses bağlantısı health check başlat
    client.voiceManager.startHealthCheck();
    
    // Slash komutları kaydet
    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }
    
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (guild) {
            await guild.commands.set(commands);
            console.log('✅ Slash komutları başarıyla kaydedildi!');
        }
    } catch (error) {
        console.error('❌ Slash komutları kaydedilemedi:', error);
    }
});

// Event Handlers
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('❌ Komut hatası:', error);
            const errorMessage = { 
                content: '❌ Komut çalıştırılırken bir hata oluştu!', 
                flags: 64 // InteractionResponseFlags.Ephemeral
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    } else if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId.split('_')[0]);
        if (!button) return;
        
        try {
            await button.execute(interaction);
        } catch (error) {
            console.error('❌ Buton hatası:', error);
            const errorMessage = { 
                content: '❌ İşlem sırasında bir hata oluştu!', 
                flags: 64 // InteractionResponseFlags.Ephemeral
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    } else if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId.split('_')[0]);
        if (!modal) return;
        
        try {
            await modal.execute(interaction);
        } catch (error) {
            console.error('❌ Modal hatası:', error);
            const errorMessage = { 
                content: '❌ Form gönderilirken bir hata oluştu!', 
                flags: 64 // InteractionResponseFlags.Ephemeral
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

// Ses kanalından atılırsa otomatik yeniden bağlan
client.on('voiceStateUpdate', (oldState, newState) => {
    // Bot ses kanalından atıldıysa
    if (oldState.member && oldState.member.id === client.user.id) {
        if (oldState.channelId && !newState.channelId) {
            console.log('🔌 Bot ses kanalından atıldı, yeniden bağlanılıyor...');
            setTimeout(() => {
                client.voiceManager.joinChannel();
            }, 3000);
        }
    }
});

// Load handlers
loadHandlers();

// Login
client.login(process.env.TOKEN);