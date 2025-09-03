// utils.js
function safeResolveAttachmentUrl(resolveFunc, attachment) {
    try {
        if (!attachment) return null;         // ডেটা নেই, থেমে যাবে
        return resolveFunc(attachment);       // মূল ফাংশন কল
    } catch (err) {
        console.error("Error in safeResolveAttachmentUrl:", err);
        return null;
    }
}

module.exports = { safeResolveAttachmentUrl };
