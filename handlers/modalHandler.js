const fs = require('fs');

module.exports = (client) => {
    const modalFiles = fs.readdirSync('./modals').filter(file => file.endsWith('.js'));
    
    for (const file of modalFiles) {
        const modal = require(`../modals/${file}`);
        client.modals.set(modal.name, modal);
    }
    
    console.log(`📝 ${modalFiles.length} modal handler yüklendi`);
};