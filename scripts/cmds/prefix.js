const fs = require("fs-extra");
const moment = require("moment-timezone");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.5",
    author: "RaiHan",
    countDown: 5,
    role: 0,
    description: "Change the bot prefix in your chat box or globally (admin only)",
    category: "⚙ Configuration",
    guide: {
      en:
        "┌─『 Prefix Settings 』─┐\n"
      + "│\n"
      + "│ 🔹 {pn} <prefix>\n"
      + "│     Set prefix for this chat\n"
      + "│     Example: {pn} $\n"
      + "│\n"
      + "│ 🔹 {pn} <prefix> -g\n"
      + "│     Set global prefix (Admin only)\n"
      + "│     Example: {pn} $ -g\n"
      + "│\n"
      + "│ ♻ {pn} reset\n"
      + "│     Reset to default prefix\n"
      + "│\n"
      + "└──────────────────────┘"
    }
  },

  langs: {
    en: {
      reset:
        "┌─『 Prefix Reset 』─┐\n"
      + `│ ✅ Reset to default: %1\n`
      + "└────────────────────┘",
      onlyAdmin:
        "┌─『 Permission Denied 』─┐\n"
      + "│ ⛔ Only bot admins can change global prefix!\n"
      + "└──────────────────────────┘",
      confirmGlobal:
        "┌─『 Global Prefix Change 』─┐\n"
      + "│ ⚙ React to confirm global prefix update.\n"
      + "└────────────────────────────┘",
      confirmThisThread:
        "┌─『 Chat Prefix Change 』─┐\n"
      + "│ ⚙ React to confirm this chat's prefix update.\n"
      + "└──────────────────────────┘",
      successGlobal:
        "┌─『 Prefix Updated 』─┐\n"
      + `│ ✅ Global prefix: %1\n`
      + "└─────────────────────┘",
      successThisThread:
        "┌─『 Prefix Updated 』─┐\n"
      + `│ ✅ Chat prefix: %1\n`
      + "└─────────────────────┘",
      myPrefix:
        "┌─『 Current Prefix 』─┐\n"
      + `│ 🌍 Global: %1\n`
      + "│ 💬 This Chat: %2\n"
      + "│\n"
      + `│ ➤ Type: ${2}help\n`
      + "└─────────────────────┘"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: args[1] === "-g"
    };

    if (formSet.setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    const confirmMessage = formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmMessage, (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message, threadsData, usersData }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;
    const userName = await usersData.getName(event.senderID);

    if (event.body && event.body.toLowerCase() === "prefix") {
      const currentTime = moment().tz("Asia/Dhaka").format("hh:mm A");
      const uptimeMs = process.uptime() * 1000;

      function formatUptime(ms) {
        const sec = Math.floor(ms / 1000) % 60;
        const min = Math.floor(ms / (1000 * 60)) % 60;
        const hr = Math.floor(ms / (1000 * 60 * 60));
        return `${hr}h ${min}m ${sec}s`;
      }

      const uptime = formatUptime(uptimeMs);

      // Random stylish opening lines
      const RandomReply = [
        "Hey ${userName}, do u call for my prefix? 😏",
        "Yo ${userName}! looking for my prefix huh? 🚀",
        "Hola ${userName}, u wanna see my prefix? 🌐",
        "Oi ${userName}, prefix hunter spotted! 👀",
        "Welcome back ${userName}, prefix is waiting... 🔑",
        "Heya ${userName}, wanna play with my prefix? 🎮",
        "Sup ${userName}? here comes the prefix ⚡",
        "Dear ${userName}, your prefix request is served 🍽️",
        "Hello ${userName}, u just unlocked prefix mode 🔓",
        "Yo fam ${userName}, prefix incoming 📡",
        "Greetings ${userName}, prefix detected 🛰️",
        "Hey ${userName}, prefix vibes on the way 🎶",
        "Boss ${userName}, here’s ur prefix 👑",
        "Yo legend ${userName}, prefix is yours 🔥",
        "Hey ${userName}, u just whispered \"prefix\"? 🤫",
        "Look who’s here, ${userName}! prefix time ⏳",
        "Hey ${userName}, wanna flex with my prefix? 💎",
        "Holla ${userName}, prefix unlocked 🎯",
        "Yo ${userName}, prefix generator activated ⚙️",
        "Hehe ${userName}, caught u asking for prefix 😉",
        "✨ Hey ${userName}, I heard you whispering for my prefix…",
        "🌙 ${userName}, the stars told me you need my prefix!",
        "👑 My lord ${userName}, your prefix awaits…",
        "🌸 ${userName}, the winds carry your call for prefix.",
        "⚡ Hey ${userName}, your energy just summoned my prefix!",
        "🌹 Beloved ${userName}, here’s the prefix you seek.",
        "🔥 ${userName}, your vibe just unlocked my prefix!",
        "💎 ${userName}, only gems like you get this prefix…",
        "🌐 Hey ${userName}, ready to rule with my prefix?",
        "☁️ ${userName}, from clouds to you, prefix delivered.",
        "🎭 ${userName}, destiny called, prefix answered.",
        "🦋 Hey ${userName}, like a butterfly, prefix landed to you.",
        "🌟 ${userName}, stars align when you call my prefix.",
        "🕊️ Hey ${userName}, peace and prefix come together now.",
        "🔥 ${userName}, warriors like you deserve this prefix.",
        "👑 Bow down ${userName}, the royal prefix is here.",
        "💫 ${userName}, magic just spelled out my prefix for you.",
        "🌊 ${userName}, waves brought your prefix ashore.",
        "🌞 Hey ${userName}, like sunshine, here’s your prefix.",
        "🌌 ${userName}, galaxies opened up for your prefix."
      ];

      const randomIndex = Math.floor(Math.random() * RandomReply.length);
      const prefixMessage = RandomReply[randomIndex].replace("${userName}", userName);

      return message.reply(
`${prefixMessage}

╭❂🌐❂╮  ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx: ${globalPrefix}
╰❂🛸❂╯  ʏᴏᴜʀ ʙᴏx: ${threadPrefix}
╭❂📘❂╮  ᴄᴍɴᴅ ᴍᴇɴᴜ: ${threadPrefix}help
╰❂⏰❂╯  ᴛɪᴍᴇ: ${currentTime}
╭❂⏳❂╮  ᴜᴘᴛɪᴍᴇ: ${uptime}
╰❂👑❂╯  ᴅᴇᴠ: RaiHan`
      );
    }
  }
};
