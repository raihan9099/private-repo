const axios = require('axios');
const baseApiUrl = async () => {
  return "https://www.noobs-api.rf.gd/dipto";
};

module.exports.config = {
  name: "bot",
  aliases: ["baby", "milu", "babe"],
  version: "6.9.0",
  author: "dipto",
  countDown: 0,
  role: 0,
  description: "better then all sim simi",
  category: "chat",
  guide: {
    en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR \nall OR\nedit [YourMessage] - [NeeMessage]"
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const link = `${await baseApiUrl()}/baby`;
  const dipto = args.join(" ").toLowerCase();
  const uid = event.senderID;
  let command, comd, final;

  try {
    if (!args[0]) {
      const ran = [
        "Bolo baby",
        "hum",
        "type help baby",
        "type !baby hi"
      ];
      return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
    }

    if (args[0] === 'remove') {
      const fina = dipto.replace("remove ", "");
      const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
      return api.sendMessage(dat, event.threadID, event.messageID);
    }

    if (args[0] === 'rm' && dipto.includes('-')) {
      const [fi, f] = dipto.replace("rm ", "").split(' - ');
      const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
      return api.sendMessage(da, event.threadID, event.messageID);
    }

    if (args[0] === 'list') {
      if (args[1] === 'all') {
        const data = (await axios.get(`${link}?list=all`)).data;
        const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
          const number = Object.keys(item)[0];
          const value = item[number];
          const name = (await usersData.get(number)).name;
          return { name, value };
        }));
        teachers.sort((a, b) => b.value - a.value);
        const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
        return api.sendMessage(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
      } else {
        const d = (await axios.get(`${link}?list=all`)).data.length;
        return api.sendMessage(`Total Teach = ${d}`, event.threadID, event.messageID);
      }
    }

    if (args[0] === 'msg') {
      const fuk = dipto.replace("msg ", "");
      const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
      return api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
    }

    if (args[0] === 'edit') {
      const command = dipto.split(' - ')[1];
      if (command.length < 2) return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
      return api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
      const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
      const tex = re.data.message;
      const teacher = (await usersData.get(re.data.teacher)).name;
      return api.sendMessage(`✅ Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'amar') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
      return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach react ", "");
      if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
      return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
    }

    if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('amr name ki') || dipto.includes('whats my name')) {
      const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
      return api.sendMessage(data, event.threadID, event.messageID);
    }

    const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}&font=1`)).data.reply;
    api.sendMessage(d, event.threadID, (error, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "reply",
        messageID: info.messageID,
        author: event.senderID,
        d, 
        apiUrl: link
      });
    }, event.messageID);

  } catch (e) {
    console.log(e);
    api.sendMessage("Check console for error", event.threadID, event.messageID);
  }
};

module.exports.onReply = async ({ api, event, Reply }) => {
  try {
    if (event.type == "message_reply") {
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=1`)).data.reply;
      await api.sendMessage(a, event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          a
        });
      }, event.messageID);
    }  
  } catch (err) {
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
  }
};

module.exports.onChat = async ({ api, event, message }) => {
  try {
    const body = event.body ? event.body?.toLowerCase() : "";
    if (body.startsWith("baby")|| body.startsWith("milu") || body.startsWith("milow")|| body.startsWith("bot")|| body.startsWith("hi") || body.startsWith("bby") || body.startsWith("raihan")|| body.startsWith("nobita") || body.startsWith("oi")) {
      const arr = body.replace(/^\S+\s*/, "");
      const randomReplies = ["ʙᴏʟᴏ ʙᴀʙᴜ, ᴛᴜᴍɪ ᴋɪ ᴀᴍᴀᴋᴇ ʙʜᴀʟᴏʙᴀꜱᴏ? 🙈💋",
        "ᴋᴀʟᴋᴇᴅᴇᴋʜᴀ ᴋᴏʀɪꜱ ᴛᴏ ᴇᴋᴛᴜ 😈ᴋᴀᴊ ᴀꜱᴇ😒",
        "ᴅᴜʀᴇ ᴊᴀ, ᴛᴏʀᴏ ᴋᴏɴᴏ ᴋᴀᴊ ɴᴀɪ, ꜱʜᴜᴅʜᴜ 𝗯𝗯𝘆 𝗯𝗯𝘆 ᴋᴏʀɪꜱ  😉😋🤣",
        "ᴛᴏʀ ᴋɪ ᴄʜᴏᴋʜᴇ ᴘᴏʀᴇ ɴᴀ ᴀᴍɪ ʙʏᴀꜱᴛᴏ ᴀꜱɪ😒",
        "ʜᴏᴘ ʙᴇᴅᴀ😾,ʙᴏꜱꜱ ʙᴏʟ ʙᴏꜱꜱ😼",
        "ɢᴏꜱʜᴏʟ ᴋᴏʀᴇ ᴀʏ ᴊᴀ😑😩",
        "ᴇᴛᴀʏ ᴅᴇᴋʜᴀʀ ʙᴀᴋɪ ꜱɪʟᴏ_🙂🙂🙂",
        "ᴀᴍɪ ᴛʜᴀᴋʟᴇᴏ ᴊᴀ, ɴᴀ ᴛʜᴀᴋʟᴇᴏ ᴛᴀ !❤",
        "ᴛᴏʀ ʙɪʏᴇ ʜᴏʏ ɴɪ 𝗕𝗯𝘆 ʜᴏɪʟᴏ ᴋɪʙʜᴀʙᴇ,,🙄",
        "ᴄʜᴜᴘ ᴛʜᴀᴋ ,ɴᴀɪ ᴛᴏ ᴛᴏʀ ᴅᴀᴛ ʙʜᴇɢᴇ ᴅɪʙᴏ ᴋɪɴᴛᴜ",
        "ᴛᴜᴍᴀʀᴇ ᴀᴍɪ ʀᴀɪᴛᴇ ʙʜᴀʟᴏʙᴀꜱɪ 🐸📌",
        "ᴀᴊᴋᴇ ᴀᴍᴀʀ ᴍᴏɴ ʙʜᴀʟᴏ ɴᴇɪ",
        "ᴏɪ ᴛᴜᴍɪ ꜱɪɴɢʟᴇ ɴᴀ?🫵🤨",
        "ᴀʀᴇ ᴀᴍɪ ᴍᴏᴊᴀ ᴋᴀʀᴀʀ ᴍᴏᴏᴅ ᴇ ɴᴀɪ😒",
        "ᴀᴍɪ ᴏɴʏᴇʀ ᴊɪɴɪꜱᴇʀ ꜱᴀᴛʜᴇ ᴋᴛʜᴀ ʙᴏʟɪ ɴᴀ__😏",
        "ᴏᴋᴇ𝙵𝙖𝙧𝙢𝙖𝙬__😒",
        "ʙʜᴜʟᴇ ᴊᴀᴏ ᴀᴍᴀᴋᴇ 😞😞",
        "𝗧𝗼𝗿 𝘀𝗮𝘁𝗲 𝗸𝗼𝘁𝗵𝗮 𝗻𝗮𝗶,𝗧𝘂𝗶 𝗮𝗯𝗮𝗹😼",
        "ᴀᴍɪ ᴀʙᴀʟ ᴅᴇʀ ꜱᴀᴛʜᴇ ᴋᴛʜᴀ ʙᴏʟɪ ɴᴀ,ᴏᴋ😒",
        "ᴀᴍʀ ᴊᴀɴᴜ ʟᴀɢʙᴇ,ᴛᴜᴍɪ ᴋɪ ꜱɪɴɢʟᴇ ᴀꜱᴏ?",
        "ᴇᴛᴏ ᴋɪᴜᴛ  ᴋᴇᴍɴᴇ ʜᴏɪʟɪ ! ᴋɪ ᴋʜᴀꜱ😒",
        "ʜᴀ ᴊᴀɴᴜ , ᴇɪᴅɪᴋ ᴇ ᴀꜱᴏ ᴋɪꜱ ᴅᴇɪ🤭 😘",
        "𝗧𝗮𝗿𝗽𝗼𝗿 𝗯𝗼𝗹𝗼_🙂",
        "ꜰʟɪʀᴛ ᴍᴀᴛ ᴋᴀʀᴏ ꜱᴀᴅɪ ʙᴀʟɪ ʙᴀᴛ ᴋᴀʀᴏᴏ😒",
        "ᴀᴍᴀʀ ᴇxᴀᴍ ᴀᴍɪ ᴘᴏʀᴛᴀꜱɪ",
        "ᴍᴏʀᴇ ɢᴇꜱɪ ᴋᴀʀᴏɴ ᴛᴏᴍᴀᴋᴇ ꜱᴀʀᴀ ᴀᴍɪ ʙᴀᴄᴍᴜ ɴᴀ",
        "ʙᴇꜱʜɪ ʙʙʏ ʙʙʙʏ ᴋᴏʀʟᴇ ʟᴇᴀᴠᴇ ɴɪʙᴏ ᴋɪɴᴛᴜ😒😒",
        "ᴀᴍɪ ᴛᴏᴍᴀʀ ꜱɪɴɪᴏʀ ᴀᴘᴜ ᴏᴋᴇ 😼",
        "ꜱᴏᴍᴍᴀɴ ᴅᴇᴏ🙁",
        "ᴍᴇꜱꜱᴀɢᴇ ɴᴀ ᴅɪʏᴇ ᴛᴏ ᴄᴀʟʟ ᴀᴡ ᴅɪᴛᴇ ᴘᴀʀᴏ ᴛᴀʏ ɴᴀ?",
        "ᴀᴍᴀᴋᴇ ᴅᴇᴋᴏ ɴᴀ,ᴀᴍɪ ʙʏᴀꜱᴛᴏ ᴀꜱɪ",
        "ᴛᴏʀᴀ ᴊᴇ ʜᴀʀᴇ 𝗕𝗯𝘆 ᴅᴀᴋᴄʜɪꜱ ᴀᴍɪ ᴛᴏ ꜱᴏᴛʏɪ ʙᴀᴄᴄʜᴀ ʜᴏʏᴇ ᴊᴀʙᴏ_☹😑",
        "ᴋᴇᴍɴᴇ ᴀꜱᴏ",
        "ꜱᴜɴᴏ ᴅʜᴏɪʀᴊᴏ ᴀʀ ꜱᴏʜᴊᴏ ᴊɪʙᴏɴᴇʀ ꜱᴏʙ😊🌻💜",
        "ɢᴏʟᴀᴘ ꜰᴜʟ ᴇʀ ᴊᴀʏɢᴀʏ ᴀᴍɪ ᴅɪʟᴀᴍ ᴛᴏᴍᴀʏ ᴍᴇꜱᴇᴊ°",
        "ᴋᴛʜᴀ ᴅᴇᴏ ᴀᴍᴀᴋᴇ ᴘᴏᴛᴀʙᴀ...!!😌",
        "ᴇᴍʙɪ ᴋɪɴᴇ ᴅᴇᴏ ɴᴀ_🥺🥺",
        "ɢꜰ ʙʜᴇʙᴇ ᴇᴋᴛᴜ ꜱʜᴀꜱᴏɴ ᴋᴏʀᴇ ᴊᴀᴏ!🐸",
        "ɢᴏʀᴜ ᴜᴅᴅᴇ ᴀᴋᴀꜱʜᴇ ꜱᴀʟᴀᴍɪ ᴘᴀᴛʜᴀɴ ʙɪᴋᴀꜱʜᴇ 💸💰",
        "ʙᴏʟᴇɴ ᴍʏᴀᴅᴀᴍ__😌ᴍᴇᴡᴡ",
        "ʙᴀʀ ʙᴀʀ ᴅɪꜱᴛᴜʀʙ ᴋᴏʀᴇᴄʜɪꜱ ᴋᴏɴᴏ😾,",
        "ᴀᴍᴀʀ ᴊᴀɴᴜ ᴇʀ ꜱᴀᴛʜᴇ ʙʏᴀꜱᴛᴏ ᴀꜱɪ😋-",
        "ᴄʜᴏᴜᴅʜᴜʀɪ ꜱᴀʜᴇʙ ᴀᴍɪ ɢᴏʀɪʙ ʜᴏᴛᴇ ᴘᴀʀɪ.😾🤭 ᴋɪɴᴛᴜ-ʙᴏʀᴏʟᴏᴋ ɴᴀ.🥹😫",
        "ᴀʀ ᴀᴋʙᴀʀ ʙᴀʙʏ ʙᴏʟʟᴇ ᴅᴇɪᴋʜᴏ ᴛᴏᴍᴀʀ ᴀᴋᴅɪɴ ɴᴀᴋɪ ᴀᴍʀ 10 ᴅɪɴ😒",
        "ᴏꜱʏᴀꜱʟᴀᴍᴏᴡᴀʟɪᴋᴜᴍ",
        "ᴋɪ ʜᴏʟᴏ ,ᴍɪꜱ ᴛɪꜱ ᴋᴏʀᴄᴄʜɪꜱ ɴᴀᴋɪ🤣",
        "ᴋᴀᴄʜᴇ ᴀꜱᴏ ᴋᴛʜᴀ ᴀꜱᴇ",
        "ᴀᴍ ɢᴀᴄʜʜᴇ ᴀᴍ ɴᴀɪ ᴅʜɪʟ ᴋᴇɴᴏ ᴍᴀʀᴏ, ᴛᴏᴍᴀʀ ꜱᴀᴛʜᴇ ᴘʀᴇᴍ ɴᴀɪ ʙᴇʙɪ ᴋᴇɴᴏ ᴅᴀᴋᴏ",
        "ᴀɢᴇ ᴇᴋᴛᴀ ɢᴀɴ ʙᴏʟᴏ,☹ɴᴀʜᴏʟᴇ ᴋᴛʜᴀ ʙᴏʟʙᴏ ɴᴀ_🥺",
        "ᴀᴄᴄʜᴀ ꜱʜᴜɴᴏ_😒",
        "𝗕𝗯𝘆 ɴᴀ ᴊᴀɴᴜ,ʙᴏʟ 😌",
        "ʟᴜɴɢɪ ᴛᴀ ᴅʜᴏʀ ᴍᴜᴛᴇ ᴀꜱɪ🙊🙉",
        "ᴛᴏᴍᴀᴋᴇ ꜱᴀʀᴀ ᴀᴍɪ ʙᴀᴄʜᴍᴜ ɴᴀ ʙᴀʙʏ",
        "ᴛᴏᴍᴀʀ ʙꜰ ᴋᴇᴍᴏɴ ᴀꜱᴇ?",
        "ᴛᴜᴍɪ ᴇᴛᴏ ʙʙʏ ᴅᴀᴋᴏ ᴛᴀʏ ᴛᴜᴍɪ ᴀʙᴀʟ 🐸",
        "ᴍɪꜱꜱ ᴋᴏʀꜱᴇʟᴀ ?",
        "ᴏɪ ᴍᴀᴍᴀ ᴀʀ ᴅᴀᴋɪꜱ ɴᴀ ᴘʟɪᴢ",
        "ᴀᴍᴀᴋᴇ ɴᴀ ᴅᴇᴋʜᴇ ᴇᴋᴛᴜ ᴘᴏʀᴏᴛᴇᴏ ʙᴏꜱʜᴛᴇ ᴛᴏ ᴘᴀʀᴏ🥺🥺",
        "𝗕𝗯𝘆 ʙᴏʟᴇ ᴏꜱʜᴏᴍᴍᴀɴ ᴋᴏʀᴄᴄʜɪꜱ,😰😿",
        "ᴍᴇꜱꜱᴀɢᴇ ɴᴀ ᴅɪʏᴇ ᴛᴏ ᴛᴇᴀᴄʜ ᴀᴡ ᴅɪᴛᴇ ᴘᴀʀᴏ ᴛᴀʏ ɴᴀ?",
        "ᴀᴊ ᴇᴋᴛᴀ ꜰᴏɴ ɴᴀɪ ʙᴏʟᴇ ʀɪᴘʟᴀʏ ᴅɪᴛᴇ ᴘᴀʀʟᴀᴍ ɴᴀ_🙄",
        "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
        "𝗕𝗯𝘆 𝗻𝗮 𝗯𝗼𝗹𝗲,,𝗚𝗿𝗼𝘂𝗽 𝗮 𝗰𝗮𝗹𝗹 𝗹𝗮𝗴𝗮😑😑😑",
        "ᴀʀ ᴋᴏᴛ ʙᴀʀ ᴅᴀᴋʙɪ ,ꜱʜᴜɴᴄʜɪ ᴛᴏ",
        "ʙꜰ ʙʜᴇʙᴇ ᴇᴋᴛᴜ ꜱʜᴀꜱᴏɴ ᴋᴏʀᴇ ᴊᴀᴏ!🐸",
        "𝗕𝗯𝘆 ʙᴏʟʟᴇ ᴄʜᴀᴋʀɪ ᴛʜᴀᴋʙᴇ ɴᴀ",
        "ᴀᴊʙ ᴛᴏ__😒",
        "ᴇᴋᴛᴀ ʙꜰ ᴋʜᴜɴᴊᴇ ᴅᴇᴏ 🥺🥺",
        "ᴍʙ ɴᴇʏ ʙʏᴇ",
        "ᴏɪ ᴍᴀᴍᴀ ᴀʀ ᴅᴀᴋɪꜱ ɴᴀ ᴘɪʟɪꜱ",
        "ᴇᴛᴏᴋʜʜᴏɴ ᴘᴏʀᴇ ᴍᴏɴᴇ ʜᴏɪʟᴏ ᴀᴍᴀᴋᴇ?🙁",
        "ᴀᴍɪ ᴛᴏ ᴏɴᴅʜᴏ ᴋɪᴄʜᴜ ᴅᴇᴋʜɪ ɴᴀ🐸 😎",
        "ᴏ ᴀᴄᴄʜᴀ",
        "ᴀᴍᴀʀ ꜱᴏɴᴀʀ ʙᴀɴɢʟᴀ ,ᴛᴀʀᴘᴏʀᴇ ʟᴀɪɴ ᴋɪ ?",
        "ʙᴀʙʏ ꜱᴜɴᴏ ꜱᴇɪ ᴀᴋᴛᴀ ᴡᴇᴀᴛʜᴇʀ ᴛᴀʏ ɴᴀ ʙᴏʟᴏ🫣",
        "৩২ ᴛᴀʀɪᴋʜ ᴀᴍᴀʀ ʙɪʏᴇ",
        "ʜᴀ ʙᴏʟᴏ, ꜱʜᴜɴᴄʜɪ ᴀᴍɪ 😏",
        "ʙᴏʟᴏ ꜰᴜʟᴛᴜꜱʜɪ_😘",
        "ᴛᴜᴍɪ ᴏ ᴇᴋᴀ, ᴀᴍɪ ᴏ ᴇᴋᴀ ᴇʙᴀʀ ᴀᴍᴀᴅᴇʀ ᴘʀᴇᴍ ᴊᴏᴍʙᴇ ᴊʜᴀᴋᴀɴᴀᴋᴀ😁😁",
        "ᴠᴀʟᴏ ᴋɪ ʜᴏɪʙᴀ ɴᴀ?",
        "৮১ , ৮২ , ৮৩ ᴀᴍɪ ᴛᴏᴍᴀᴋᴇ ʙʜᴀʟᴏʙᴀꜱɪ",
        "ʜᴀ ʙᴏʟᴏ😒,ᴋɪ ᴋᴏʀᴛᴇ ᴘᴀʀɪ😐😑?",
        "ᴇᴛᴏ ᴅᴀᴋᴄʜɪꜱ ᴋᴏɴᴏ?",
        "ɢᴀʟɪ ꜱʜᴜɴʙɪ ɴᴀᴋɪ? 🤬",
        "ʙᴏʟᴏ ᴋɪ ʙᴏʟʙᴀ, ꜱʙᴀʀ ꜱᴀᴍɴᴇ ʙᴏʟʙᴀ ɴᴀᴋɪ?🤭🤏",
        "𝘼𝙢𝙞 𝙠𝙖𝙡𝙖 𝙣𝙖 𝙨𝙪𝙣𝙨𝙚 ,𝙗𝙤𝙡𝙤 𝙠𝙞 𝙗𝙤𝙡𝙗𝙖",
        "ꜱᴏʀʀʏ ᴀᴍɪ ʙᴜꜱʏ ᴀꜱɪ",
        "ʙᴏʟᴇɴ ꜱɪʀ__😌ʙʏᴇ",
        "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏",
        "ʙᴏʟᴏ ᴋɪ ᴋᴏʀᴛᴇ ᴘᴀʀɪ ᴛᴏᴍᴀʀ ᴊᴏɴɴᴏ",
        "ᴇɪ ɴᴀᴏ ᴊᴜꜱ ᴋʜᴀᴏ..! ʙʙʏ ʙᴏʟᴛᴇ ʙᴏʟᴛᴇ ʜᴀᴘᴀɪ ɢᴇᴄʜᴏ ɴᴀ 🥲",
        "ᴅᴇᴋʜᴀ ʜᴏʟᴇ ᴋᴀᴛʜɢᴏʟᴀᴘ ᴅɪᴏ..🤗",
        "ᴀᴍᴀᴋᴇ ᴅᴀᴋʟᴇ, ᴀᴍɪ ᴋɪɴᴛᴜ ᴋɪꜱꜱ ᴋᴏʀᴇ ᴅɪʙᴏ 😘",
        "ʙᴇꜱɪ ʙᴇʙɪ ʙᴏʟʟᴇ ᴋᴀᴍᴜʀ ᴅɪᴍᴜ,,🤭",
        "ɪ ʟᴏᴠᴇ ʏᴏᴜ! ᴀᴍᴀʀ ꜱᴏɴᴀ, ᴍᴏʏɴᴀ, ᴛɪʏᴀ 😍",
        "ᴀᴍᴀᴋᴇ ᴋɪ ᴛᴜᴍɪ ʙʜᴀʟᴏʙᴀꜱᴏ? 💕",
        "ᴊᴀ ᴠᴀɢ, ᴄʜɪᴘᴀʙᴀᴢ__😼",
        "ᴛᴜɪ ꜱᴇɪ ʟᴜɪᴄᴄʜᴀᴛᴀ ɴᴀ!? 🙂🔪",
        "ᴋɪ ʜᴏɪꜱᴇ ᴀᴍᴀʀ ᴋɪ ᴋᴀᴊᴇ ʟᴀɢʙᴇ ᴛᴜʀ!? 🌚👀",
        "ᴛᴏʀ ᴋᴏᴛʜᴀ ᴛᴏʀ ʙᴀʀɪ ᴋᴇᴜ ꜱᴜɴᴇ ɴᴀ, ᴛᴏ ᴀᴍɪ ᴋᴇɴᴏ ꜱᴜɴʙᴏ? 🤔😂",
        "ʙᴇꜱɪ ᴅᴀᴋʟᴇ ᴀᴍᴍᴜ ʙᴏᴋᴀ ᴅᴇʙᴀ ᴛᴏ__🥺",
        "ᴀᴍɪ ʙᴏᴛ ɴᴀ, ᴀᴍᴀᴋᴇ ʙʙʏ ʙᴏʟᴏ ʙʙʏ!! 😘",
        "ᴛᴏʀ ʜᴀᴀᴛ ᴅʜᴏʀʟᴇ ᴍᴏɴ ʜᴏʏ ᴀᴍɪ ʙᴀᴛᴛᴇʀʏ ᴄʜᴀʀɢᴇ ᴋᴏʀᴛᴇꜱɪ 🥀",
        "ᴛᴜɪ ᴀᴍᴀʀ ᴄʜᴏᴋʜ ᴇʀ ᴠɪᴛᴀᴍɪɴ… ᴅᴇᴋʜᴀ ɴᴀ ᴅɪʟᴇ ᴀᴍɪ ᴡᴇᴀᴋ ʜᴏʏᴇ ᴊᴀɪ 👀",
        "ᴛᴏʀ ᴇᴋᴛᴀ ʜᴀʟꜰ ꜱᴍɪʟᴇ ᴀᴍᴀʀ ꜱᴏɴᴀ ʀᴀᴛ ᴄʜᴀɴɢᴇ ᴋᴏʀᴇ ᴅɪꜱʜᴇ 🔥",
        "ᴄʜᴀɴᴅᴇʀ ᴀʟᴏ ᴛᴇ ᴛᴏʀ ᴍᴜᴋʜ ᴅᴇᴋʜʟᴇ ᴍᴏɴ ʜᴏʏ ᴄʜᴏʀɪ ᴋᴏʀᴇ ɴɪʏᴇ ᴊᴀɪ 💋",
        "_tumi amar naughty boy! 🫣",
        "Hey,bro It's me milow",
        "_cholo ekta naughty plan start kori 🙂"
        "Bolo babu, tumi ki amake bhalobaso? 😌🍂",
        "Kalk a dekha koris to ektu😒",
        "Dure ja, tor kono kaj nai, shudhu baby baby koris😒😤",
        "Tor ki choke pore na ami besto asi..🙂",
        "Hop beda, boss bol boss😎",
        "Goshol kore ay ja🙂",
        "Etay dekhar baki silo..?🙂",
        "Ami thakleo ja, na thakleo ta😊",
        "Tor biye hoy ni Baby hoilo ki bhabe🥲",
        "Chup thak, noyto tor dat bhenge dibo kintu👊🏻🐱",
        "Tumare ami raite bhalobasi🤧😌",
        "Ajke amar mon bhalo nei__",
        "Oi tumi single na🙄",
        "Are ami moja karar mood e nai🤗",
        "Ami onyer jinis er sathe ktha bol i na😒",
        "Oke Farmaw",
        "Bhule jawo amake😓",
        "Tor sate kotha nai, Tui abal—__–",
        "Ami abal der sathe ktha bol i na, ok😽",
        "Amr janu lagbe, tumi ki single aso🥸",
        "Eto cute kemne hoili! Ki khas🙂",
        "Ha janu, eidik e aso kis dei🙄",
        "Tarpor bolo🙂",
        "Flirt mat karo sadi bali bat karoo❤️‍🩹",
        "Amar exam ami portasi",
        "More gesi kar on tomake sara ami bacmu na",
        "Besh i baby baby korle leave nib o kintu",
        "Ami tomar senior apu oke",
        "Somman deo",
        "Message na diye to call aw dite paro tai na",
        "Amake deko na, ami byasto asi",
        "Tora je hare Baby dakchis ami to soty i baccha hoye jabo",
        "Kemne aso",
        "Suno dhoirjo ar sohjo jiboner sob",
        "Golap ful er jaygay ami dilam tomay message",
        "Ktha deo amake potaba",
        "Embi kine deo na",
        "Gf bhebe ektu shason kore ja o",
        "Goru udde akashe salam pathan bikashe",
        "Bolen myadam meww",
        "Bar bar dist urb kor echis kono",
        "Amar janu er sathe byasto asi",
        "Choudhuri saheb ami gorib hoye pari. Kintu borolok na",
        "Ar akbar baby bolle deikho tomar akdin naki amr 10 din",
        "Osyasalamowalikum",
        "Ki holo, mis tis korcchis naki",
        "Kache aso ktha ase",
        "Am gacche am nai dhil keno maro, tomar sathe prem nai bebi keno dako",
        "Age ekta gan bolo, nahole ktha bolbo na",
        "Accha shuno",
        "Baby na janu, bol",
        "Lungi ta dhor mute asi",
        "Tomake sara ami bachmu na baby",
        "Tomar bf kemon ase",
        "Tumi eto baby dako tai tumi abal",
        "Miss korsela",
        "Oi mama ar dak is na pliz",
        "Amake na dekhe ektu poroteo boshte to paro",
        "Baby bole oshomman korcchis",
        "Message na diye to teach aw dite paro tai na",
        "Aj ekta fon nai bole riplay dite parl am na",
        "I love you",
        "Baby na bole, Group a call laga",
        "Ar kot bar dakbi, shunchi to",
        "Bf bhebe ektu shason kore ja o",
        "Baby bolle chakri thakbe na",
        "Ajb to",
        "Ekta bf khunje deo",
        "Mb ney bye",
        "Oi mama ar dak is na pilis",
        "Etokhhon pore mone hoilo amake",
        "Ami to ondho kichu dekhi na",
        "O accha",
        "Amar sonar bangla, tar pore lain ki",
        "Baby suno sei akta weather tai na bolo",
        "32 tarikh amar biye",
        "Ha bolo, shunchi ami",
        "Bolo fultushi",
        "Tumi o eka, ami o eka ebar amader prem jombe jhakanaka",
        "Valo ki hoiba na",
        "81, 82, 83 ami tomake bhalobasi",
        "Ha bolo, ki kort e pari",
        "Eto dakchis kono",
        "Gali shunbi naki",
        "Bolo ki bolba, sbar samne bolba naki",
        "Ami kala na sunse, bolo ki bolba",
        "Sorry ami busy asi",
        "Bolen sir bye",
        "I hate you",
        "Bolo ki kort e pari tomar j onno",
        "Ei nao jus khao. Baby bolte bolte hapai gecho na",
        "Dekha hole kathgolap dio",
        "Amake dakle, ami kintu kiss kore dibo",
        "Besi bebi bolle kamur dimu",
        "I love you! Amar sona, moyna, tiya",
        "Amake ki tumi bhalobaso",
        "Ja vag, chipabaz",
        "Tui sei luicchata na",
        "Ki hoise amar ki kaje lagbe tur",
        "Tor kotha tor bari keu shune na, to ami keno shunbo",
        "Besi dak le ammu boka deba to",
        "Ami bot na, amake baby bolo baby",
        "Tor haat dh orle mon hoy ami battery charge kortesi",
        "Tui amar choke r vitamin. Dekha na dile ami weak hoye jai",
        "Tor ekta half smile amar sona rat change kore dishe",
        "Chander alo te tor muk dekhle mon hoy chori kore niye jai",
        "tumi amar naughty boy",
        "Hey, bro It's me milow",
        "cholo ekta naughty plan start kori"
      ];
      if (!arr) { 
        await api.sendMessage(randomReplies[Math.floor(Math.random() * randomReplies.length)], event.threadID, (error, info) => {
          if (!info) message.reply("info obj not found");
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }, event.messageID);
        return;
      }
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`)).data.reply;
      await api.sendMessage(a, event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          a
        });
      }, event.messageID);
    }
  } catch (err) {
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
  }
};
