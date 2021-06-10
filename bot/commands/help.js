const Discord = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Shows help embed',
    execute(msg, args, bot) {
        let prefix = bot.config.prefix;

        let embed = new Discord.MessageEmbed()
            .setColor(bot.config.color)
            .setTitle('Call of Duty 1.1 Bot')
            .addField('Show servers', '`' + prefix + 'servers`', true)
            .addField('Show players', '`' + prefix + 'players <server>`', true)
            .setFooter('Bot by defected.dev');

        msg.channel.send(embed);
    }
}