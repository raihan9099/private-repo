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
			unauthorizedGroup: "Nhóm của bạn chưa được ủy quyền. Để được ủy quyền, vui lòng tham gia nhóm hỗ trợ tại: https://m.me/j/AbYP0EG_FgmtmJ99/\nGroup TID: %1",
			leftGroup: "Bot đã rời khỏi nhóm chưa được ủy quyền: %1 (TID: %2)"
		},
		en: {
			unauthorizedGroup: "Your group is unauthorized. To get authorization, please join the support group by -supportgc command!",
			leftGroup: "Bot left unauthorized group: %1 (TID: %2)"
		}
	},

	onStart: async ({ api, event, threadsData, getLang }) => {
		if (event.logMessageType === "log:subscribe" && 
			event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
			
			return async function () {
				const { threadID, author } = event;
				const { config } = global.GoatBot;
				
				// Check if the person who added the bot is an admin
				if (config.adminBot.includes(author)) {
					return; // Admin added the bot, no need to check authorization
				}

				try {
					// Check if group is already approved
					const threadData = await threadsData.get(threadID);
					if (threadData.data.groupApproved === true) {
						return; // Group is approved, continue normally
					}

					// Get thread info to get the group name
					let threadName = threadID;
					try {
						const threadInfo = await api.getThreadInfo(threadID);
						threadName = threadInfo.threadName || threadID;
					} catch (err) {
						console.error("Error getting thread info:", err);
						// Continue with threadID as fallback
					}

					// Send unauthorized message with thread ID included
					const unauthorizedMessage = getLang("unauthorizedGroup", threadID);
					await api.sendMessage(unauthorizedMessage, threadID);
					
					// Wait a bit then leave the group
					setTimeout(async () => {
						try {
							await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
							
							// Log to admin with thread ID
							const logMessage = getLang("leftGroup", threadName, threadID);
							
							for (const adminID of config.adminBot) {
								try {
									await api.sendMessage(logMessage, adminID);
								} catch (adminErr) {
									console.error(`Error sending log to admin ${adminID}:`, adminErr);
								}
							}
						} catch (err) {
							console.error("Error leaving unauthorized group:", err);
						}
					}, 3000); // 3 second delay to ensure message is sent first
					
				} catch (err) {
					console.error("Error in group authorization check:", err);
				}
			};
		}
	}
};
