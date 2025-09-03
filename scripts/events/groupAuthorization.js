const { getTime } = global.utils;

module.exports = {
    config: {
        name: "groupAuthorization",
        version: "2.0",
        author: "Assistant",
        envConfig: {
            enable: true,
            supportGroup: "m.me/hydrocarbonn",
            autoLeave: false, // Auto-leave permanently disabled
            notifyAdmins: true // Notify admins when bot is added to new groups
        },
        category: "events"
    },

    langs: {
        vi: {
            unauthorizedGroup: "❌ Nhóm của bạn chưa được uthorization. Để được ủy quyền, vui lòng tham gia nhóm hỗ trợ tại: %1\nGroup TID: %2\n\nLiên hệ admin: %3",
            adminNotification: "🤖 Bot vừa được thêm vào nhóm mới:\n\n📝 Tên nhóm: %1\n🆔 Thread ID: %2\n👤 Người thêm: %3\n✅ Trạng thái: %4",
            approvedStatus: "Đã ủy quyền",
            pendingStatus: "Chờ ủy quyền"
        },
        en: {
            unauthorizedGroup: "❌ Your group is unauthorized. To get authorization, please join our support group: %1\nGroup TID: %2\n\nContact admin: %3",
            adminNotification: "🤖 Bot was added to a new group:\n\n📝 Group Name: %1\n🆔 Thread ID: %2\n👤 Added by: %3\n✅ Status: %4",
            approvedStatus: "Approved",
            pendingStatus: "Pending Authorization"
        }
    },

    onStart: async ({ api, event, threadsData, getLang, usersData }) => {
        if (event.logMessageType === "log:subscribe" &&
            event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {

            const { threadID, author } = event;
            const { config } = global.GoatBot;
            const envConfig = global.client.moduleConfig.groupAuthorization;

            try {
                // Check if group is already approved
                const threadData = await threadsData.get(threadID);

                if (threadData.data.groupApproved === true) return;

                // Get thread info
                let threadName = threadID;
                let adderName = author;

                try {
                    const threadInfo = await api.getThreadInfo(threadID);
                    threadName = threadInfo.threadName || "Unknown Group";

                    // Get adder's name
                    const userData = await usersData.get(author);
                    adderName = userData.name || author;
                } catch (err) {
                    console.error("Error getting thread/user info:", err);
                }

                // Admin added the bot - auto-approve
                if (config.adminBot.includes(author)) {
                    await threadsData.set(threadID, { groupApproved: true }, "data");

                    const welcomeMessage = `✅ Group automatically approved by admin!\n\n` +
                                           `Group: ${threadName}\n` +
                                           `You can now use all bot features.`;
                    await api.sendMessage(welcomeMessage, threadID);

                    if (envConfig.notifyAdmins) {
                        await notifyAdmins(api, config.adminBot, getLang, threadName, threadID, adderName, true);
                    }
                    return;
                }

                // Send unauthorized message
                const unauthorizedMessage = getLang(
                    "unauthorizedGroup",
                    envConfig.supportGroup,
                    threadID,
                    author // Admin contact
                );

                await api.sendMessage(unauthorizedMessage, threadID);

                // Notify admins
                if (envConfig.notifyAdmins) {
                    await notifyAdmins(api, config.adminBot, getLang, threadName, threadID, adderName, false);
                }

            } catch (err) {
                console.error("Error in group authorization check:", err);
            }
        }
    }
};

// Helper function to notify admins
async function notifyAdmins(api, adminIDs, getLang, threadName, threadID, adderName, isApproved) {
    const status = isApproved ? getLang("approvedStatus") : getLang("pendingStatus");
    const notificationMessage = getLang(
        "adminNotification",
        threadName,
        threadID,
        adderName,
        status
    );

    for (const adminID of adminIDs) {
        try {
            await api.sendMessage(notificationMessage, adminID);
        } catch (adminErr) {
            console.error(`Error sending notification to admin ${adminID}:`, adminErr);
        }
    }
                        }
