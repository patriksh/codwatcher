const Discord = require('discord.js');

module.exports = {
    name: 'players',
    description: 'Gets server players.',
    execute(msg, args, bot, settings) {
        let srv, error = 'Please specify a server.';

        if(!args.length) return msg.channel.send(err);

        for(server of bot.config.servers)
            if(server.id == args[0].toLowerCase()) srv = server;

        if(!srv) return msg.reply(error);

        let embed = new Discord.MessageEmbed()
            .setColor(bot.config.color)
            .setTitle('Loading...')
            .setDescription('Querying the server for info.');

        msg.channel.send(embed).then(async m => {
            await bot.helper.query(srv).then(status => {
                if(status) {
                    let players = { name: [], kill: [], ping: [] };
                    for(player of status.players) {
                        if(!player.name) continue;
                        players.name.push(player.name.trim());
                        players.kill.push(player.raw.frags);
                        players.ping.push(player.raw.ping);
                    }

                    if(players.name.length) {
                        msg.channel.send(new Discord.MessageEmbed()
                            .setColor(bot.config.color)
                            .setTitle(status.name + ' players')
                            .setDescription(`<cod1x://${status.connect}>`)
                            .addField('Name', players.name, true)
                            .addField('Kills', players.kill, true)
                            .addField('Ping', players.ping, true)
                        );
                    } else {
                        msg.channel.send(new Discord.MessageEmbed()
                            .setColor(bot.config.color)
                            .setTitle(status.name + ' is empty.')
                        );
                    }
                } else {
                    msg.channel.send(new Discord.MessageEmbed()
                        .setColor(bot.config.color)
                        .setTitle(status.name + ' is unreachable.')
                    );
                }
            });

            m.delete();
        });
    }
};