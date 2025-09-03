const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "2.0",
        author: "Chitron Bhattacharjee",
        category: "events"
    },

    langs: {
        en: {
            session1: "Morning",
            session2: "Day",
            session3: "Evening",
            session4: "Night",
            welcomeMessage: `
🤖 Thank you Baby for inviting me! 🌟
🚀 Let's get started! Here's some useful information:

- prefix: %1

- To discover the list of available commands, type: !help
📚 Need assistance or have questions?
Feel free to reach out to admins anytime. 
Enjoy your time in the group! 🌈✨
`,
            multiple1: "আপনি",
            multiple2: "আপনারা",
            defaultWelcomeMessage: `
👋 Hello dear, {userNameTag} Welcome ✨
🌟 You just joined the chat 
✵ Group ▸:[ {threadName} ]

Hope you're having a great {session}!
|Type {prefix}Help to see menu
Added by: {useradded}`
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType !== "log:subscribe") return;

        const hours = getTime("HH");
        const { threadID } = event;
        const { nickNameBot } = global.GoatBot.config;
        const prefix = global.utils.getPrefix(threadID);
        const dataAddedParticipants = event.logMessageData.addedParticipants;

        // If bot was added
        if (dataAddedParticipants.some(u => u.userFbId == api.getCurrentUserID())) {
            if (nickNameBot) api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
            return message.send(getLang("welcomeMessage", prefix));
        }

        if (!global.temp.welcomeEvent[threadID])
            global.temp.welcomeEvent[threadID] = { joinTimeout: null, dataAddedParticipants: [] };

        global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
        clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

        global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
            const threadData = await threadsData.get(threadID);
            if (threadData.settings.sendWelcomeMessage === false) return;

            const dataBanned = threadData.data.banned_ban || [];
            const threadName = threadData.threadName;
            const mentions = [];
            const userName = [];

            for (const user of global.temp.welcomeEvent[threadID].dataAddedParticipants) {
                if (dataBanned.some(item => item.id == user.userFbId)) continue;
                userName.push(user.fullName);
                mentions.push({ tag: user.fullName, id: user.userFbId });
            }
            if (userName.length === 0) return;

            // Get the user who added the new member(s)
            let addedByName = "Unknown";
            if (event.logMessageData.actorFbId) {
                const info = await api.getUserInfo(event.logMessageData.actorFbId);
                addedByName = info[event.logMessageData.actorFbId]?.name || "Unknown";
            }

            let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

            welcomeMessage = welcomeMessage
                .replace(/\{userName\}/g, userName.join(", "))
                .replace(/\{userNameTag\}/g, mentions.map(m => m.tag).join(", "))
                .replace(/\{threadName\}/g, threadName)
                .replace(/\{multiple\}/g, mentions.length > 1 ? getLang("multiple2") : getLang("multiple1"))
                .replace(/\{session\}/g,
                    hours <= 10 ? getLang("session1") :
                    hours <= 12 ? getLang("session2") :
                    hours <= 18 ? getLang("session3") :
                    getLang("session4"))
                .replace(/\{prefix\}/g, prefix)
                .replace(/\{useradded\}/g, useraddedName);

            const form = { body: welcomeMessage, mentions: mentions.length ? mentions : null };

            if (threadData.data.welcomeAttachment) {
                const files = threadData.data.welcomeAttachment;
                const attachments = await Promise.allSettled(files.map(file => drive.getFile(file, "stream")));
                form.attachment = attachments.filter(r => r.status === "fulfilled").map(r => r.value);
            }

            message.send(form);
            delete global.temp.welcomeEvent[threadID];
        }, 3000);
    }
};
