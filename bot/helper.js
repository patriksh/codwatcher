const Discord = require('discord.js');
const Gamedig = require('gamedig');

module.exports.query = async function(server) {
    let options = {
        type: 'cod',
        host: server.ip,
        port: server.port,
        socketTimeout: 3000,
        maxAttempts: 3
    };

    try {
        return await Gamedig.query(options);
    } catch(err) {
        console.error(err);
    }

    return null;
}

module.exports.loginBots = function(mainBot) {
    let statusBots = [];
    mainBot.config.servers.forEach(server => {
        let bot = new Discord.Client();
        bot.login(server.token);
        bot.gameserver = server;
        bot.on('ready', () => statusBots.push(bot));
    });

    return statusBots;
}

module.exports.updateBots = function(statusBots) {
    statusBots.forEach(async bot => {
        bot.user.setStatus('online');
        let status = await exports.query(bot.gameserver);

        if(status) {
            bot.user.setActivity(status.players.length + '/' + status.maxplayers + ' - ' + status.map, { type: 'PLAYING' });
        } else {
            bot.user.setActivity('server offline', { type: 'WATCHING' });
        }
    });
}

module.exports.parseCommand = function(cmd) {
    let split = cmd.split(' ');
    let player = split[1];
    let reason = split.slice(2).join(' ');

    return { player, reason };
}