const { getTime, drive } = global.utils;

module.exports = {
    config: {
        name: "leave",
        version: "3.1",
        author: "Raihan",
        category: "events"
    },

    langs: {
        en: {
            // === Formal Style ===
            leaveType1Formal: "Voluntarily left",
            leaveType2Formal: "Kicked by admin {kickerTag}",
            formalLeaveMessage:
`{userNameTag} has left the {threadName} group.
Reason: {type}

We will miss their presence 💔`,

            // === Funny Style ===
            leaveType1Funny: "Ran away on their own 😂",
            leaveType2Funny: "Got kicked out by {kickerTag} 🚀",
            funnyLeaveMessage:
`🤣 Breaking News!   

{userNameTag} has left our group {threadName}.  

👉 Reason: {type}  

We will miss their presence (even if they escaped 🤣).  
But don’t worry, the fun never stops here! 😎✨`
        }
    },

    onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
        if (event.logMessageType == "log:unsubscribe")
            return async function () {
                const { threadID } = event;
                const threadData = await threadsData.get(threadID);
                if (!threadData.settings.sendLeaveMessage)
                    return;

                const { leftParticipantFbId } = event.logMessageData;
                if (leftParticipantFbId == api.getCurrentUserID())
                    return;

                const threadName = threadData.threadName;
                const userName = await usersData.getName(leftParticipantFbId);

                // Kicker info
                const kickerID = event.author;
                const kickerName = await usersData.getName(kickerID);

                // === Choose Style: "formal" or "funny" ===
                const leaveStyle = threadData.data.leaveStyle || "formal";

                let leaveMessage, type;
                if (leaveStyle === "formal") {
                    type = leftParticipantFbId == event.author
                        ? getLang("leaveType1Formal")
                        : getLang("leaveType2Formal").replace("{kickerTag}", kickerName);
                    leaveMessage = getLang("formalLeaveMessage");
                } else {
                    type = leftParticipantFbId == event.author
                        ? getLang("leaveType1Funny")
                        : getLang("leaveType2Funny").replace("{kickerTag}", kickerName);
                    leaveMessage = getLang("funnyLeaveMessage");
                }

                // Mentions
                const mentions = [
                    { tag: userName, id: leftParticipantFbId }
                ];
                if (type.includes(kickerName)) {
                    mentions.push({ tag: kickerName, id: kickerID });
                }

                // Replace placeholders
                leaveMessage = leaveMessage
                    .replace(/\{userName\}/g, userName)
                    .replace(/\{userNameTag\}/g, userName)
                    .replace(/\{kickerName\}/g, kickerName)
                    .replace(/\{kickerTag\}/g, kickerName)
                    .replace(/\{type\}/g, type)
                    .replace(/\{threadName\}|\{boxName\}/g, threadName);

                const form = { body: leaveMessage, mentions };

                // Attachments if any
                if (threadData.data.leaveAttachment) {
                    const files = threadData.data.leaveAttachment;
                    const attachments = files.reduce((acc, file) => {
                        acc.push(drive.getFile(file, "stream"));
                        return acc;
                    }, []);
                    form.attachment = (await Promise.allSettled(attachments))
                        .filter(({ status }) => status == "fulfilled")
                        .map(({ value }) => value);
                }

                message.send(form);
            };
    }
};
