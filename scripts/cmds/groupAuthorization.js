const { getTime } = global.utils;

module.exports = {
    config: {
        name: "groupAuthorization",
        version: "1.1",
        author: "Assistant",
        envConfig: {
            enable: true
        },
        category: "events"
    },

    langs: {
        vi: {
            unauthorizedGroup: "Nhóm của bạn chưa được ủy quyền. Để được ủy quyền, vui lòng tham gia nhóm hỗ trợ tại: m.me/hydrocarbonn\nGroup TID: %1"
        },
        en: {
            unauthorizedGroup: "Your group is unauthorized. To get authorization, please Contact the admin bot by Using -callad say something hi5
        }
    },

    onStart: async ({ api, event, threadsData, getLang }) => {
        if (
            event.logMessageType === "log:subscribe" &&
            event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID())
        ) {
            return async function () {
                const { threadID, author } = event;
                const { config } = global.GoatBot;

                // Admin added the bot, skip authorization
                if (config.adminBot.includes(author)) return;

                try {
                    // Check if group is already approved
                    const threadData = await threadsData.get(threadID);
                    if (threadData.data.groupApproved === true) return;

                    // Get thread info for nicer message (optional)
                    let threadName = threadID;
                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        threadName = threadInfo.threadName || threadID;
                    } catch (err) {
                        console.error("Error getting thread info:", err);
                    }

                    // Send unauthorized message
                    const unauthorizedMessage = getLang("unauthorizedGroup", threadID);
                    await api.sendMessage(unauthorizedMessage, threadID);

                    // === REMOVE LEAVE LOGIC ===
                    // Bot will no longer leave the group
                    // You can optionally log this to admin if needed
                    /*
                    const logMessage = `Unauthorized group added bot: ${threadName} (TID: ${threadID})`;
                    for (const adminID of config.adminBot) {
                        try {
                            await api.sendMessage(logMessage, adminID);
                        } catch (adminErr) {
                            console.error(`Error sending log to admin ${adminID}:`, adminErr);
                        }
                    }
                    */

                } catch (err) {
                    console.error("Error in group authorization check:", err);
                }
            };
        }
    }
};
