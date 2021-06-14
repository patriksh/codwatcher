# CoD Watcher
A Discord bot for Call of Duty 1 servers. Features include live server status, chat logs, report & ban alerts and spam & bad-word automute.

## Setup

### Gameserver
Files regarding your CoD server are in "server" folder. Open it.

1. Add `codwatcher.log` and `codwatcher.cfg` to "main" (or fs_game) folder of your server.
2. Include `codwatcher.cfg` in your server configuration file with `exec codwatcher.cfg`.
3. Add `codwatcher.gsc` to "codam" folder of your server.
4. Add the mod to CoDaM "modlist.gsc" - `[[ register ]]( "CoD Watcher", codam\codwatcher::main );`.

To use the plugin with MiscMod, do the following:

1. Open "codam/_mm_commands.gsc"
2. Search for `str = codam\_mm_mmm::strip(str);`
3. Add the following code above that line:
    ```c
        if(!self codam\codwatcher::message(str)) {
            creturn();
            return;
        }
    ```

To use the plugin with other chat command systems, add the same block of code as for MiscMod in your chat message callback function.
You will also need to include your mute/unmute logic in "codwatcher.gsc" file.

### Bot

1. Put the "bot" folder somewhere in your server directory. We'll assume you put it outside your "main" folder.
2. Head over to "bot" folder.
3. Cofigure the settings in "config.json".
4. Install the required modules with `npm install`.
5. Run the bot with the following command `node app.js`.