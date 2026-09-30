export const getAttachmentContentDisposition = (filename) => {
  const safeFilename = String(filename || "attachment")
    .replace(/[\\/\0\r\n]/g, "")
    .slice(0, 255) || "attachment";
  const fallbackFilename = safeFilename.replace(/[^\x20-\x7E]|["\\]/g, "_");
  const encodedFilename = encodeURIComponent(safeFilename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`;
};