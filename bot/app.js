/*
 * Bot.
*/
const Discord = require('discord.js');

const bot = new Discord.Client();
bot.config = require('./config.json');
bot.helper = require('./helper');

bot.commands = new Discord.Collection();
const botCommands = require('./commands');
Object.keys(botCommands).map(key => {
    bot.commands.set(botCommands[key].name, botCommands[key]);
});

bot.login(bot.config.token);
bot.on('ready', () => {
    console.info('Bot is ready.');
    bot.user.setStatus('online');

    statusBots = bot.helper.loginBots(bot);
    setInterval(function() {
        bot.helper.updateBots(statusBots);
    }, 5000);
});

bot.on('message', msg => {
    if((!msg.content.startsWith(bot.config.prefix) || msg.author.bot) && !msg.mentions.has(bot.user)) return;
    let args = msg.content.slice(bot.config.prefix.length).split(' ');
    let command = args.shift().toLowerCase();

    if(!bot.commands.has(command)) return;

    try {
        bot.commands.get(command).execute(msg, args, bot);
    } catch(error) {
        console.log(error);
        msg.channel.send('Error... Read console. :eyes:')
    }
});

/*
 * Reports, badwords, chat log, etc. 
*/
const Tail = require('tail').Tail;
const Filter = require('bad-words');
const RCON = require('quake3-rcon');
const filter = new Filter();

function readChat(bot, server) {
    let tail = new Tail(server.path + '/vcod-discord.log', "\n", {}, true);
    let rcon = new RCON({ address: server.ip, port: server.port, password: server.pass });

    tail.on('line', line => {
        let data = line.split('%');
        let msg = { authorID: data[0], authorName: data[1], content: data[2] };

        if(filter.isProfane(msg.content))
            rcon.send('set command "badword ' + msg.authorID + '"');

        if(msg.content.startsWith('!report')) {
            let report = bot.helper.parseCommand(msg.content);
            let channel = bot.channels.cache.get(bot.config.reportChannel);

            return channel.send(`${server.name} | \`${report.player}\` has been reported by \`${msg.authorName}\` for \`${report.reason}\`.`);
        }

        if(msg.content.startsWith('!ban')) {
            let ban = bot.helper.parseCommand(msg.content);
            let channel = bot.channels.cache.get(bot.config.banChannel);

            return channel.send(`${server.name} | \`${ban.player}\` has been banned by \`${msg.authorName}\` for \`${ban.reason}\`.`);
        }

        if(msg.content.startsWith('!')) return; // Do not forward chat commands to chat log.

        let channel = bot.channels.cache.get(server.logChannel);
        channel.send(`\`${msg.authorName}: ${msg.content}\``);
    });
}

bot.config.servers.forEach(server => {
    readChat(bot, server);
});