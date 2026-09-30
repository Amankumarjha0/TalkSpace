import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { BsDownload, BsFileEarmark, BsFileEarmarkPdf, BsThreeDotsVertical, BsX } from "react-icons/bs";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";

const formatFileSize = (size) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const MIN_IMAGE_LOADING_MS = 700;

const FILE_TYPE_LABELS = {
  ".doc": "Word document",
  ".docx": "Word document",
  ".pdf": "PDF document",
  ".ppt": "PowerPoint presentation",
  ".pptx": "PowerPoint presentation",
};

const MIME_TYPES_BY_EXTENSION = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { setMessages } = useConversation();
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [activeImageSaved, setActiveImageSaved] = useState(false);
  const [revealedAttachmentIds, setRevealedAttachmentIds] = useState([]);

  const fromMe = String(message.senderId) === String(authUser?._id);

  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const bubbleBgColor = fromMe ? "bg-[#212020] border border-white/10" : "";
  const shakeClass = message.shouldShake ? "shake" : "";
  const deletedForEveryone = message.deletedForEveryone;

  function extractTime(dateString) {
    const date = new Date(dateString);
    let hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const amOrPm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${amOrPm}`;
  }

  function padZero(number) {
    return number.toString().padStart(2, "0");
  }

  const formattedTime = extractTime(message.createdAt);

  const attachmentDownloadUrl = (attachmentIndex) =>
    `/api/messages/${message._id}/attachments/${attachmentIndex}/download`;

  const revealImageAfterSave = (attachment) => {
    if (attachment.resourceType !== "image" && !attachment.mimeType?.startsWith("image/")) return;
    setRevealedAttachmentIds((current) => current.includes(attachment.publicId)
      ? current
      : [...current, attachment.publicId]);
    if (activeImage?.publicId === attachment.publicId) setActiveImageSaved(true);
  };

  const saveAttachment = async (attachment, attachmentIndex) => {
    const filename = attachment.originalName || "attachment";
    const extension = filename.includes(".")
      ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
      : "";
    const mimeType = MIME_TYPES_BY_EXTENSION[extension] || attachment.mimeType || "application/octet-stream";
    const types = extension
      ? [{
          description: FILE_TYPE_LABELS[extension] || `${extension.slice(1).toUpperCase()} file`,
          accept: { [mimeType]: [extension] },
        }]
      : undefined;

    try {
      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          ...(types ? { types, excludeAcceptAllOption: true } : {}),
        });
        const response = await fetch(attachmentDownloadUrl(attachmentIndex), {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Could not download this file");

        const writable = await fileHandle.createWritable();
        await writable.write(await response.blob());
        await writable.close();
        revealImageAfterSave(attachment);
        return;
      }

      const response = await fetch(attachmentDownloadUrl(attachmentIndex), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Could not download this file");

      const objectUrl = URL.createObjectURL(await response.blob());
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      downloadLink.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      revealImageAfterSave(attachment);
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error(error.message || "Could not download this file");
      }
    }
  };

  const openImagePreview = (attachment, attachmentIndex, showLoader) => {
    setActiveImageSaved(false);
    if (!showLoader) {
      setLoadingPreviewId(null);
      setActiveImage({ ...attachment, attachmentIndex });
      return;
    }

    const startedAt = Date.now();
    setLoadingPreviewId(attachment.publicId);
    const image = new Image();
    image.onload = () => {
      const remainingLoadingTime = Math.max(0, MIN_IMAGE_LOADING_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        setActiveImage({ ...attachment, attachmentIndex });
        setLoadingPreviewId(null);
      }, remainingLoadingTime);
    };
    image.onerror = () => {
      setLoadingPreviewId(null);
      toast.error("Could not load this image");
    };
    image.src = attachment.url;
  };

  const handleDelete = async (scope) => {
    setDeleting(true);
    try {
      const endpoint = scope === "me"
        ? `/api/messages/${message._id}/for-me`
        : `/api/messages/${message._id}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not delete message");

      if (scope === "me") {
        setMessages((current) => current.filter((item) => item._id !== message._id));
      } else {
        setMessages((current) => current.map((item) => item._id === message._id
          ? { ...item, message: "", attachments: [], deletedForEveryone: true }
          : item));
      }
      setShowDeletePrompt(false);
    } catch (error) {
      toast.error(error.message || "Could not delete message");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`chat ${chatClassName} relative`}>
      <div
        className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}
      >
        {deletedForEveryone ? (
          <span className="italic text-gray-400">This message was deleted</span>
        ) : (
          <>
            {message.message && <p className="whitespace-pre-wrap break-words">{message.message}</p>}
            {message.attachments?.length > 0 && (
              <div className={`flex max-w-full flex-wrap gap-2 ${message.message ? "mt-2" : ""}`}>
                {message.attachments.map((attachment, attachmentIndex) => {
                  const isImage = attachment.resourceType === "image" || attachment.mimeType?.startsWith("image/");
                  const wasRevealedBefore = attachment.revealedFor?.some(
                    (userId) => String(userId) === String(authUser?._id)
                  );
                  const imageIsRevealed = fromMe || wasRevealedBefore || revealedAttachmentIds.includes(attachment.publicId);
                  return isImage ? (
                    <div key={attachment.publicId} className="group relative max-w-full overflow-hidden rounded">
                      <img
                        src={imageIsRevealed ? attachment.url : attachment.previewUrl || attachment.url}
                        alt={imageIsRevealed ? attachment.originalName : `Preview of ${attachment.originalName}`}
                        className={`max-h-72 max-w-full rounded object-contain ${imageIsRevealed ? "" : "blur-[2px]"}`}
                      />
                      <button
                        type="button"
                        onClick={() => openImagePreview(attachment, attachmentIndex, !fromMe && !imageIsRevealed)}
                        disabled={loadingPreviewId === attachment.publicId}
                        aria-label={`View image ${attachment.originalName}`}
                        title="View image"
                        className={`absolute inset-0 z-0 flex items-center justify-center text-white transition ${imageIsRevealed ? "bg-transparent" : "bg-black/20 hover:bg-black/40"} ${loadingPreviewId === attachment.publicId ? "!bg-black/35" : ""}`}
                      >
                        {loadingPreviewId === attachment.publicId ? (
                          <span className="loading loading-spinner loading-sm text-emerald-400" />
                        ) : !imageIsRevealed && !fromMe ? (
                          <span className="rounded-full bg-black/75 px-4 py-2 text-sm font-medium">View image</span>
                        ) : null}
                      </button>
                    </div>
                  ) : (
                    <div key={attachment.publicId} className="flex max-w-full items-center gap-3 rounded border border-white/15 bg-black/20 px-3 py-2 text-sm text-white">
                      {attachment.mimeType === "application/pdf"
                        ? <BsFileEarmarkPdf aria-hidden="true" className="shrink-0 text-red-400" size={22} />
                        : <BsFileEarmark aria-hidden="true" className="shrink-0 text-gray-300" size={22} />}
                      <div className="min-w-0 flex-1">
                        <p className="max-w-56 truncate">{attachment.originalName}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                      </div>
                      {!fromMe && (
                        <button
                          type="button"
                          onClick={() => saveAttachment(attachment, attachmentIndex)}
                          aria-label={`Download ${attachment.originalName}`}
                          title="Save as"
                          className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs text-pink-200 hover:bg-white/10"
                        >
                          <BsDownload aria-hidden="true" size={15} />
                          <span>Save as</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
        {formattedTime}
        {!deletedForEveryone && (
          <button
            type="button"
            onClick={() => setShowDeletePrompt(true)}
            aria-label="Delete message"
            title="Delete message"
            className="ml-1 rounded p-1 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <BsThreeDotsVertical size={14} />
          </button>
        )}
      </div>
      {activeImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={`Image preview: ${activeImage.originalName}`}>
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <span className="max-w-[75vw] truncate text-sm">{activeImage.originalName}</span>
            <button
              type="button"
              onClick={() => {
                setActiveImage(null);
                setActiveImageSaved(false);
              }}
              aria-label="Close image preview"
              title="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <BsX size={24} />
            </button>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
            <div className="relative flex max-h-full max-w-full items-center">
              <img
                src={activeImage.url}
                alt={activeImage.originalName}
                className="max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-5rem)] object-contain"
              />
              {!fromMe && !activeImageSaved && (
                <button
                  type="button"
                  onClick={() => saveAttachment(activeImage, activeImage.attachmentIndex)}
                  aria-label={`Save ${activeImage.originalName} as a file`}
                  title="Save as"
                  className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg hover:bg-emerald-400"
                >
                  <BsDownload aria-hidden="true" size={20} />
                </button>
              )}
            </div>
          </main>
        </div>
      )}
      {showDeletePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowDeletePrompt(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby={`delete-title-${message._id}`} className="w-full max-w-sm rounded-lg border border-white/10 bg-[#151515] p-5 shadow-xl">
            <h2 id={`delete-title-${message._id}`} className="mb-2 text-lg font-semibold text-white">Delete message?</h2>
            <p className="mb-5 text-sm text-gray-400">Choose who should no longer see this message.</p>
            <div className="flex flex-col gap-2">
              <button type="button" disabled={deleting} onClick={() => handleDelete("me")} className="rounded border border-white/15 px-3 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50">
                Delete for me
              </button>
              {fromMe && (
                <button type="button" disabled={deleting} onClick={() => handleDelete("everyone")} className="rounded border border-red-400/40 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                  Delete for everyone
                </button>
              )}
              <button type="button" disabled={deleting} onClick={() => setShowDeletePrompt(false)} className="rounded px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;

Message.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    senderId: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    message: PropTypes.string,
    attachments: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string.isRequired,
      previewUrl: PropTypes.string,
      openUrl: PropTypes.string,
      downloadUrl: PropTypes.string,
      publicId: PropTypes.string.isRequired,
      resourceType: PropTypes.string.isRequired,
      originalName: PropTypes.string.isRequired,
      mimeType: PropTypes.string,
      size: PropTypes.number.isRequired,
      revealedFor: PropTypes.arrayOf(PropTypes.string),
    })),
    deletedForEveryone: PropTypes.bool,
    shouldShake: PropTypes.bool,
  }).isRequired,
};
