// Bot
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
    console.info('Bot is online.');
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

// Chat parser 
const Tail = require('tail').Tail;
const Filter = require('bad-words');
const RCON = require('quake3-rcon');
const proxycheck_node = require('proxycheck-node.js');
const filter = new Filter();
let proxycheck = null;
if(bot.config.proxycheck !== undefined && bot.config.proxycheck !== "") {
    proxycheck = new proxycheck_node({ api_key: bot.config.proxycheck });
}
let checkedIPs = [];

// To add/remove words from badword check use this.
// filter.removeWords('word1', 'word2');
// filter.addWords('word3', 'word4');

function readChat(server) {
    let tail = new Tail(server.path + '/codwatcher.log', "\n", {}, true);
    let rcon = new RCON({ address: server.ip, port: server.port, password: server.pass });

    tail.on('line', async line => {
        let data = line.split('%');
        let msg = { authorID: data[0], authorName: data[1], content: data[2] };

        if(msg.content.startsWith('"connect') && proxycheck != null) {
            let ip = msg.content.split(' ')[1];
            if(!checkedIPs.includes(ip)) {
                let res = await proxycheck.check(ip, { vpn: true });
                
                if(res.status == 'ok' && res[ip].proxy == 'yes')
                    rcon.send('set command "kickvpn ' + msg.authorID + '"');
                else
                    checkedIPs.push(ip);
            }

            return;
        }

        if(filter.isProfane(msg.content)) {
            rcon.send('set command "badword ' + msg.authorID + '"');
        }

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
    readChat(server);
});
