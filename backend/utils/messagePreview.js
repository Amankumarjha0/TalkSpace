export const getMessagePreview = (message) => {
  if (message?.message) return message.message;

  const attachments = message?.attachments || [];
  if (attachments.length > 1) return `${attachments.length} attachments`;
  if (attachments[0]?.resourceType === "image") return "Photo";
  if (attachments.length === 1) return "File";

  return "";
};