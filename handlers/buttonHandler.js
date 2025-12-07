const fs = require('fs');

module.exports = (client) => {
    const buttonFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js'));
    
    for (const file of buttonFiles) {
        const button = require(`../buttons/${file}`);
        client.buttons.set(button.name, button);
    }
    
    console.log(`🔘 ${buttonFiles.length} buton handler yüklendi`);
};