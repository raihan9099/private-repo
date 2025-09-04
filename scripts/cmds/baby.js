const axios = require('axios');

const baseApiUrl = async () => {
  return "https://www.noobs-api.rf.gd/dipto";
};

module.exports.config = {
  name: "bot",
  aliases: ["baby", "milu", "babe"],
  version: "7.0.0",
  author: "dipto (fixed by assistant)",
  countDown: 0,
  role: 0,
  description: "better then all sim simi",
  category: "chat",
  guide: {
    en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR \nall OR\nedit [YourMessage] - [NeeMessage]"
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  // 🚫 Prevent bot from replying to its own messages
  if (event.senderID == api.getCurrentUserID()) return;

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
        return api.sendMessage(`Total Teach = ${data.length}\nList of Teachers of baby\n${output}`, event.threadID, event.messageID);
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
      if (!command || command.length < 2) 
        return api.sendMessage('Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
      return api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (!command || command.length < 2) return api.sendMessage('Invalid format!', event.threadID, event.messageID);
      const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
      const tex = re.data.message;
      const teacher = (await usersData.get(re.data.teacher)).name;
      return api.sendMessage(`Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'amar') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (!command || command.length < 2) return api.sendMessage('Invalid format!', event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
      return api.sendMessage(`Replies added ${tex}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach react ", "");
      if (!command || command.length < 2) return api.sendMessage('Invalid format!', event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
      return api.sendMessage(`Replies added ${tex}`, event.threadID, event.messageID);
    }

    if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('whats my name')) {
      const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
      return api.sendMessage(data, event.threadID, event.messageID);
    }

    const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}&font=0`)).data.reply;
    api.sendMessage(d, event.threadID, (error, info) => {
      if (!info) return;
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

module.exports.onReply = async ({ api, event }) => {
  // 🚫 Prevent bot from replying to itself
  if (event.senderID == api.getCurrentUserID()) return;

  try {
    if (event.type == "message_reply") {
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=0`)).data.reply;
      await api.sendMessage(a, event.threadID, (error, info) => {
        if (!info) return;
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
  // 🚫 Prevent bot from replying to itself
  if (event.senderID == api.getCurrentUserID()) return;

  try {
    const body = event.body ? event.body?.toLowerCase() : "";
    if (body.startsWith("baby") || body.startsWith("raihan") || body.startsWith("milow") || body.startsWith("bot") || body.startsWith("hi") || body.startsWith("bby") || body.startsWith("nobita") || body.startsWith("oi")) {
      const arr = body.replace(/^\S+\s*/, "");
      const randomReplies = [
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
          if (!info) message.kori"
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

      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=0`)).data.reply;
      await api.sendMessage(a, event.threadID, (error, info) => {
        if (!info) return;
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
