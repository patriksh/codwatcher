/*
 * Register callbacks & commands.
*/
main(phase, register) {
    switch(phase) {
        case "init":
            init(register);
        case "load":
        case "standalone":
            load();
        break;
    }
}

init(register) {
    file = getCvar("fs_basepath") + "/main/codwatcher.log";

    if(!isDefined(level.dftd)) level.dftd = [];

    level.dftd["chatmute"] = spawnStruct();
    level.dftd["chatmute"].file = file;
    level.dftd["chatmute"].spam = getCvarInt("dftd_chatmute_spam");                      // 1 to enable anti-spam, 0 to disable anti-spam.
    level.dftd["chatmute"].spamCount = getCvarInt("dftd_chatmute_spam_count");          // Amount of messages before muting.
    level.dftd["chatmute"].badword = getCvarInt("dftd_chatmute_badword");              // 1 to enable anti-badword, 0 to disable anti-badword.
    level.dftd["chatmute"].badwordCount = getCvarInt("dftd_chatmute_badword_count");  // Amount of messages before muting.
    level.dftd["chatmute"].unmute = getCvarInt("dftd_chatmute_unmute");              // Seconds until automated unmute (may differ if sv_fps is changed).

    [[ register ]] ("gt_endMap", ::clearChatLog, "thread");
    [[ register ]] ("PlayerConnect", ::logConnect, "thread");
}

load() {
    _F = level.codam_f_commander;
    if(!isDefined(_F)) return;

    name = "codam/CoDWatcher";
    [[ _F ]] (name, "badword", ::badWord, "nowait");
    [[ _F ]] (name, "kickvpn", ::kickVPN, "nowait");
}

/*
 * Called when a message is sent in chat.
 * If returns false, message won't be displayed (player is muted).
*/
message(msg) {
    display = true;

    if(level.dftd["chatmute"].spam && self spamMute(msg))
        display = false;

    self thread logMessage(msg);

    return display;
}

/*
 * Temporarily mutes the player if they send X repeated messages of the same content.
 * Returns if player got muted or not (don't log the message if muted).
*/
spamMute(msg) {
    if(!isDefined(self.pers["spammute"])) {
        self.pers["spammute"] = [];
        self.pers["spammute"]["count"] = 0;
        self.pers["spammute"]["message"] = "";
    }

    if(msg == self.pers["spammute"]["message"]) {
        self.pers["spammute"]["count"]++;
    } else {
        self.pers["spammute"]["count"] = 0;
    }

    self.pers["spammute"]["message"] = msg;

    if(self.pers["spammute"]["count"] >= level.dftd["chatmute"].spamCount) {
        sendChatMessage(namefix(self.name) + "^7^7 has been temporarily muted due to chat spam.");
        self mutePlayer();
        self thread unmuteTimer();

        return true;
    }

    return false;
}

/*
 * Called when node.js app detects a bad word in a message.
 * Either mute the player immediatelly or warn them.
*/
badWord(args, a1) {
    if(!isDefined(args) || (args.size < 2)) return;
    player = codam\utils::playerFromId(args[1]);
    if(!isDefined(player)) return;
    if(!level.dftd["chatmute"].badword) return;

    if(!isDefined(player.pers["badmute"]))
        player.pers["badmute"] = 1;
    else
        player.pers["badmute"]++;

    if(player.pers["badmute"] >= level.dftd["chatmute"].badwordCount) {
        sendChatMessage(namefix(player.name) + "^7^7 has been temporarily muted due to using bad words.");
        player mutePlayer();
        player thread unmuteTimer();
    } else {
        sendChatMessage("^1Warning:^7 Continuous usage of bad words will lead to a temporary mute.", player);
    }
}

/*
 * Called when node.js app detects a VPN client to kick them.
*/
kickVPN(args, a1) {
    if(!isDefined(args) || (args.size < 2)) return;
    player = codam\utils::playerFromId(args[1]);
    if(!isDefined(player)) return;

    wait 5; // If the player takes longer to connect it doesn't kick them(?)

    message = "To connect please turn ^1off^7 your VPN/Proxy.";
    player dropclient(message);
}

/*
 * Called after a player is muted. This will automatically unmute them after X seconds.
*/
unmuteTimer() {
    self endon("disconnect");
    
    wait(level.dftd["chatmute"].unmute);

    self unmutePlayer();

    self.pers["spammute"]["count"] = 0;
    self.pers["spammute"]["message"] = "";
    sendChatMessage(namefix(self.name) + "^7^7 has been unmuted.");
}

/*
 * Log the message to be parsed by bad-word node.js app.
*/
logMessage(msg) {
    if(fexists(level.dftd["chatmute"].file)) {
        line = "";
        line += self getEntityNumber();
		line += "%%" + strip(monotone(self.name));
		line += "%%" + strip(monotone(msg));
        line += "\n";

        f = fopen(level.dftd["chatmute"].file, "a");
        if(f != -1) fwrite(line, f);
        fclose(f);
    }
}

/*
 * Log when user connects to check for VPN.
*/
logConnect(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, b0, b1, b2, b2, b4, b5, b6, b7, b8, b9) {
    msg  = "\"connect ";
    msg += self getip();
    self thread logMessage(msg);
}

/*
 * Clear the chat log file when map ends.
*/
clearChatLog(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, b0, b1, b2, b3, b4, b5, b6, b7, b8, b9) {
    if(fexists(level.dftd["chatmute"].file)) {
        fclose(fopen(level.dftd["chatmute"].file, "w"));
    }
}

// Helpers...
mutePlayer() {
    if(hasMiscmod()) {
        self.pers["mm_mute"] = true;
        rID = "";
        if(getCvar("tmp_mm_muted") != "") rID += getCvar("tmp_mm_muted");
        rID += self getEntityNumber();
        rID += ";";
        setCvar("tmp_mm_muted", rID);
    } else {
        // Implement here the mute logic for your chat command system.
    }
}

unmutePlayer() {
    if(hasMiscmod()) {
        self.pers["mm_mute"] = undefined;
        codam\_mm_commands::_removeMuted(self getEntityNumber());
    } else {
        // Implement here the unmute logic for your chat command system.
    }
}

hasMiscmod() {
    return isDefined(level.miscmodversion);
}

sendChatMessage(msg, player) {
    prefix = "Server";
    if(isDefined(level.nameprefix)) prefix = level.nameprefix;

    if(!isDefined(player))
        sendservercommand("i \"^7^7" + prefix + "^7: " + msg + "\"");
    else
        player sendservercommand("i \"^7^7" + prefix + "^7: " + msg + "\"");
}

// All following functions are from Miscmod, _mm_mmm.gsc. Credits to Cato.

namefix(normalName) {
    if(!isDefined(normalName)) return "";
    
    allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'#/&()=?+`^~*-.,;<>|$�@:[]{}_ ";
    badName = false;
    for(i = 0; i < normalName.size; i++) {
        matchFound = false;

        for(z = 0; z < allowedChars.size; z++) {
            if(normalName[i] == allowedChars[z]) {
                matchFound = true;
                break;
            }
        }

        if(!matchFound) {
            badName = true;
            break;
        }
    }

    if(badName) {
        fixedName = "";
        for(i = 0; i < normalName.size; i++) {
            for(z = 0; z < allowedChars.size; z++) {
                if(normalName[i] == allowedChars[z]) {
                    fixedName += normalName[i];
                    break;
                }
            }
        }

        return fixedName;
    }

    return normalName;
}

validate_number(input, isfloat) {
    if(!isDefined(input)) return false;

    if(!isDefined(isfloat)) isfloat = false;

    dot = false;

    input += "";
    for(i = 0; i < input.size; i++) {
        switch(input[i]) {
            case "0": case "1": case "2":
            case "3": case "4": case "5":
            case "6": case "7": case "8":
            case "9":
            break;
            case ".":
                if(i == 0 || !isfloat || dot) return false;

                dot = true;
            break;
            default:
            return false;
        }
    }

    return true;
}

monotone(str, loop) {
    if(!isDefined(str)) return "";

    _str = "";
    for(i = 0; i < str.size; i++) {
        if(str[i] == "^" && ((i + 1) < str.size && (validate_number(str[i + 1])))) {
            i++;
            continue;
        }

        _str += str[i];
    }

    if(!isDefined(loop)) _str = monotone(_str, true);

    return _str;
}

strip(s) {
    if(s == "") return "";

    s2 = "";
    s3 = "";

    i = 0;
    while(i < s.size && s[i] == " ")
        i++;

    if(i == s.size) return "";

    for(; i < s.size; i++)
        s2 += s[i];

    i = (s2.size - 1);
    while(s2[i] == " " && i > 0)
        i--;

    for(j = 0; j <= i; j++)
        s3 += s2[j];

    return s3;
}
