const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "1.6",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Bật/tắt, thêm, xóa quyền whiteListIds",
      en: "Toggle, add, remove whiteListIds role"
    },
    longDescription: {
      vi: "Bật/tắt, thêm, xóa quyền whiteListIds",
      en: "Toggle, add, remove whiteListIds role"
    },
    category: "owner",
    guide: {
      vi: "{pn} on/off: Bật hoặc tắt chế độ whitelist\n{pn} [add|-a] <uid|@tag>: Thêm quyền\n{pn} [remove|-r] <uid|@tag>: Xóa quyền\n{pn} [list|-l]: Xem danh sách",
      en: "{pn} on/off: Toggle whitelist mode\n{pn} [add|-a] <uid|@tag>: Add role\n{pn} [remove|-r] <uid|@tag>: Remove role\n{pn} [list|-l]: List all"
    },
  },

  langs: {
    vi: {
      toggledOn: "✅ | Đã bật chế độ whitelist.",
      toggledOff: "❌ | Đã tắt chế độ whitelist.",
      currentStatus: "🔄 | Trạng thái hiện tại: %1",
      added: "✅ | Đã thêm quyền whiteListIds cho %1 người dùng:\n%2",
      alreadyAdmin: "\n⚠ | %1 người dùng đã có quyền:\n%2",
      missingIdAdd: "⚠ | Vui lòng nhập ID hoặc tag người dùng để thêm quyền",
      removed: "✅ | Đã xóa quyền của %1 người dùng:\n%2",
      notAdmin: "⚠ | %1 người dùng không có quyền:\n%2",
      missingIdRemove: "⚠ | Vui lòng nhập ID hoặc tag người dùng để xóa quyền",
      listAdmin: "👑 | Danh sách whiteListIds:\n%1",
    },
    en: {
      toggledOn: "✅ | Whitelist mode has been turned ON.",
      toggledOff: "❌ | Whitelist mode has been turned OFF.",
      currentStatus: "🔄 | Current whitelist status: %1",
      added: "✅ | Added role for %1 users:\n%2",
      alreadyAdmin: "\n⚠ | %1 users already have role:\n%2",
      missingIdAdd: "⚠ | Please enter ID or tag to add role",
      removed: "✅ | Removed role of %1 users:\n%2",
      notAdmin: "⚠ | %1 users don't have role:\n%2",
      missingIdRemove: "⚠ | Please enter ID or tag to remove role",
      listAdmin: "👑 | List of whiteListIds:\n%1",
    },
  },

  onStart: async function ({ message, args, usersData, event, getLang, api }) {
    const permission = ["100084228500089"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("You don't have enough permission to use this command. Only My Authors Have Access.", event.threadID, event.messageID);
    }

    switch (args[0]) {
      case "on": {
        config.whiteListMode.status = true;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("toggledOn"));
      }

      case "off": {
        config.whiteListMode.status = false;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("toggledOff"));
      }

      case "add": case "-a": case "+": {
        if (!args[1]) return message.reply(getLang("missingIdAdd"));
        let uids = Object.keys(event.mentions).length ? Object.keys(event.mentions) : event.messageReply ? [event.messageReply.senderID] : args.filter(arg => !isNaN(arg));
        const notAdminIds = [], authorIds = [];
        for (const uid of uids) (config.whiteListMode.whiteListIds.includes(uid) ? authorIds : notAdminIds).push(uid);
        config.whiteListMode.whiteListIds.push(...notAdminIds);
        const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(
          (notAdminIds.length ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "") +
          (authorIds.length ? getLang("alreadyAdmin", authorIds.length, authorIds.map(uid => `• ${uid}`).join("\n")) : "")
        );
      }

      case "remove": case "-r": case "-": {
        if (!args[1]) return message.reply(getLang("missingIdRemove"));
        let uids = Object.keys(event.mentions).length ? Object.keys(event.mentions) : args.filter(arg => !isNaN(arg));
        const notAdminIds = [], authorIds = [];
        for (const uid of uids) (config.whiteListMode.whiteListIds.includes(uid) ? authorIds : notAdminIds).push(uid);
        for (const uid of authorIds) config.whiteListMode.whiteListIds.splice(config.whiteListMode.whiteListIds.indexOf(uid), 1);
        const getNames = await Promise.all(authorIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(
          (authorIds.length ? getLang("removed", authorIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "") +
          (notAdminIds.length ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
        );
      }

      case "list": case "-l": {
        const getNames = await Promise.all(config.whiteListMode.whiteListIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        return message.reply(getLang("listAdmin", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
      }

      default: {
        const status = config.whiteListMode.status ? "ON ✅" : "OFF ❌";
        return message.reply(getLang("currentStatus", status));
      }
    }
  }
};
