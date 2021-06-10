const Discord = require('discord.js');

module.exports = {
    name: 'servers',
    description: 'Shows gameservers.',
    execute(msg, args, bot) {
        let embed = new Discord.MessageEmbed()
            .setColor(bot.config.color)
            .setTitle('Loading...')
            .setDescription('Querying the servers for info.');
        
        msg.channel.send(embed).then(async m => {
            let embeds = [];
            for(server of bot.config.servers) {
                embeds.push(bot.helper.query(server).then(status => {
                    if(status) {
                        msg.channel.send(new Discord.MessageEmbed()
                            .setColor(bot.config.color)
                            .setTitle(status.name)
                            .addField('Players', status.players.length + '/' + status.maxplayers, true)
                            .addField('Map', status.map, true)
                            .addField('Connect', status.connect, true)
                            .setThumbnail('https://image.gametracker.com/images/maps/160x120/cod/' + status.map + '.jpg')
                        );
                    } else {
                        msg.channel.send(new Discord.MessageEmbed()
                            .setColor(bot.config.color)
                            .setTitle(status.name + ' is unreachable.')
                        );
                    }
                }));
            }

            await Promise.all(embeds);
            m.delete();
        });
    }
};