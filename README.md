# vCoD Discord Bot
vCoD Discord Bot is a bot for Call of Duty 1.1 servers.

## Features
- live server status
- alerts for reports and bans
- live message log
- spam warning/mute
- bad word warning/mute

## Server setup
Files regarding your CoD server are in "server" folder. Open it.

1. Add `vcod-discord.log` and `vcod-discord.cfg` to "main" folder of your server.
2. Include `vcod-discord.cfg` in your main server .cfg file with `exec vcod-discord.cfg`.
3. Add `vcod_discord.gsc` to "main/codam" folder of your server.
4. Add the mod to CoDaM "modlist.gsc" - `[[ register ]]( "vCoD Discord", codam\vcod_discord::main );`.

To use the plugin with MiscMod, do the following:

1. Open "codam/_mm_commands.gsc"
2. Search for `str = codam\_mm_mmm::strip(str);`
3. Add the following code above that line:
    ```c
        if(!self codam\vcod_discord::message(str)) {
            creturn();
            return;
        }
    ```

To use the plugin with other chat command systems, add the same block of code as for MiscMod in your chat message callback function.
You will also need to include your mute/unmute logic in "vcod_discord.gsc" file.

## node.js bot setup

1. Put the "bot" folder somewhere in your server directory. We'll assume you put it outside your "main" folder.
2. Head over to "bot" folder.
3. Cofigure the settings in "config.json".
4. Install the required modules with `npm install`.
5. Run the bot with the following command `node app.js`.