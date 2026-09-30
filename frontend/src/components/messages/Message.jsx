import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import {
  BsCheck,
  BsCheckAll,
  BsDownload,
  BsFileEarmark,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkPpt,
  BsFileEarmarkExcel,
  BsFileEarmarkZip,
  BsFileEarmarkText,
  BsThreeDotsVertical,
  BsX,
} from "react-icons/bs";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import { getUserFriendlyError } from "../../utils/getUserFriendlyError";

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
  ".csv": "CSV spreadsheet",
  ".xls": "Excel spreadsheet",
  ".xlsx": "Excel spreadsheet",
  ".zip": "ZIP archive",
  ".txt": "Text document",
};

const MIME_TYPES_BY_EXTENSION = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".txt": "text/plain",
};

const getIsImage = (attachment) => {
  const name = (attachment.originalName || "").toLowerCase();
  const mime = (attachment.mimeType || "").toLowerCase();
  const nonImageExtensions = [
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".csv",
    ".xls", ".xlsx", ".zip", ".txt", ".rar", ".7z",
    ".mp3", ".mp4", ".wav", ".avi", ".mov"
  ];

  if (nonImageExtensions.some((ext) => name.endsWith(ext))) return false;
  if (mime === "application/pdf" || mime.includes("document") || mime.includes("presentation") || mime.includes("spreadsheet") || mime.includes("excel")) return false;

  return mime.startsWith("image/") || attachment.resourceType === "image";
};

const getDocumentIcon = (attachment) => {
  const name = (attachment.originalName || "").toLowerCase();
  const mime = (attachment.mimeType || "").toLowerCase();

  if (name.endsWith(".pdf") || mime === "application/pdf") {
    return <BsFileEarmarkPdf aria-hidden="true" className="shrink-0 text-red-400" size={24} />;
  }
  if (name.endsWith(".doc") || name.endsWith(".docx") || mime.includes("word")) {
    return <BsFileEarmarkWord aria-hidden="true" className="shrink-0 text-blue-400" size={24} />;
  }
  if (name.endsWith(".ppt") || name.endsWith(".pptx") || mime.includes("presentation") || mime.includes("powerpoint")) {
    return <BsFileEarmarkPpt aria-hidden="true" className="shrink-0 text-amber-400" size={24} />;
  }
  if (name.endsWith(".xls") || name.endsWith(".xlsx") || name.endsWith(".csv") || mime.includes("excel") || mime.includes("spreadsheet") || mime.includes("csv")) {
    return <BsFileEarmarkExcel aria-hidden="true" className="shrink-0 text-emerald-400" size={24} />;
  }
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z") || mime.includes("zip") || mime.includes("archive")) {
    return <BsFileEarmarkZip aria-hidden="true" className="shrink-0 text-yellow-400" size={24} />;
  }
  if (name.endsWith(".txt") || mime.includes("text/plain")) {
    return <BsFileEarmarkText aria-hidden="true" className="shrink-0 text-gray-300" size={24} />;
  }

  return <BsFileEarmark aria-hidden="true" className="shrink-0 text-gray-300" size={24} />;
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
  const [loadingProgress, setLoadingProgress] = useState({});

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
    if (!getIsImage(attachment)) return;
    setRevealedAttachmentIds((current) =>
      current.includes(attachment.publicId) ? current : [...current, attachment.publicId]
    );
    if (activeImage?.publicId === attachment.publicId) setActiveImageSaved(true);
  };

  const handleRevealImage = (attachment) => {
    const id = attachment.publicId;
    if (loadingProgress[id] !== undefined || revealedAttachmentIds.includes(id)) return;

    setLoadingProgress((prev) => ({ ...prev, [id]: 1 }));

    const startedAt = Date.now();
    let currentProgress = 1;

    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 8;
      if (currentProgress >= 95) {
        currentProgress = 95;
        clearInterval(interval);
      }
      setLoadingProgress((prev) => ({ ...prev, [id]: currentProgress }));
    }, 70);

    const img = new Image();
    img.onload = () => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, 600 - elapsed);
      setTimeout(() => {
        clearInterval(interval);
        setLoadingProgress((prev) => ({ ...prev, [id]: 100 }));
        setTimeout(() => {
          setRevealedAttachmentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          setLoadingProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 200);
      }, remainingMs);
    };

    img.onerror = () => {
      clearInterval(interval);
      setLoadingProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.error("Could not load image. Please check your internet connection.");
    };
    img.src = attachment.url;
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
        const userMsg = getUserFriendlyError(error, "Could not download this file. Please try again.");
        if (userMsg) toast.error(userMsg);
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
      toast.error("Could not load this image. Please check your connection.");
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
      const userMsg = getUserFriendlyError(error, "Could not delete message. Please try again.");
      if (userMsg) toast.error(userMsg);
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
                  const isImage = getIsImage(attachment);
                  const wasRevealedBefore = attachment.revealedFor?.some(
                    (userId) => String(userId) === String(authUser?._id)
                  );
                  const imageIsRevealed = fromMe || wasRevealedBefore || revealedAttachmentIds.includes(attachment.publicId);
                  const isDownloading = loadingProgress[attachment.publicId] !== undefined;

                  return isImage ? (
                    <div key={attachment.publicId} className="group relative max-w-full overflow-hidden rounded">
                      <img
                        src={imageIsRevealed ? attachment.url : attachment.previewUrl || attachment.url}
                        alt={imageIsRevealed ? attachment.originalName : `Preview of ${attachment.originalName}`}
                        className={`max-h-72 max-w-full rounded object-contain transition-all duration-300 ${imageIsRevealed ? "" : "blur-[8px] scale-105"}`}
                      />
                      {!imageIsRevealed && !fromMe && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevealImage(attachment);
                            }}
                            disabled={isDownloading}
                            aria-label={`Load image ${attachment.originalName}`}
                            title={isDownloading ? `Loading... ${loadingProgress[attachment.publicId]}%` : `Load ${formatFileSize(attachment.size)}`}
                            className="flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-black/95 hover:scale-105 disabled:hover:scale-100"
                          >
                            {isDownloading ? (
                              <>
                                <span className="loading loading-spinner loading-xs text-emerald-400" />
                                <span className="font-semibold text-emerald-400">
                                  {loadingProgress[attachment.publicId]}%
                                </span>
                              </>
                            ) : (
                              <>
                                <BsDownload size={15} className="shrink-0 text-white" />
                                <span>{formatFileSize(attachment.size)}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (imageIsRevealed) {
                            openImagePreview(attachment, attachmentIndex, false);
                          } else if (!fromMe && !isDownloading) {
                            handleRevealImage(attachment);
                          }
                        }}
                        disabled={isDownloading}
                        aria-label={`View image ${attachment.originalName}`}
                        title={imageIsRevealed ? "View image" : "Load image"}
                        className={`absolute inset-0 z-0 flex items-center justify-center text-white transition ${imageIsRevealed ? "bg-transparent" : ""}`}
                      />
                      {imageIsRevealed && !fromMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveAttachment(attachment, attachmentIndex);
                          }}
                          aria-label={`Download image ${attachment.originalName}`}
                          title="Save image"
                          className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow-md transition hover:bg-emerald-500 hover:text-black"
                        >
                          <BsDownload aria-hidden="true" size={15} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div key={attachment.publicId} className="flex max-w-full items-center gap-3 rounded border border-white/15 bg-black/20 px-3 py-2 text-sm text-white">
                      {getDocumentIcon(attachment)}
                      <div className="min-w-0 flex-1">
                        <p className="max-w-56 truncate font-medium">{attachment.originalName}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                      </div>
                      {!fromMe && (
                        <button
                          type="button"
                          onClick={() => saveAttachment(attachment, attachmentIndex)}
                          aria-label={`Save as ${attachment.originalName}`}
                          title="Save as"
                          className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-pink-200 hover:bg-white/10 border border-pink-400/30"
                        >
                          <BsDownload aria-hidden="true" size={14} />
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
      <div className="chat-footer opacity-70 text-xs flex gap-1 items-center">
        {formattedTime}
        {fromMe && !deletedForEveryone && (
          <span
            className="inline-flex items-center ml-0.5"
            title={
              message.status === "seen"
                ? "Read / Seen"
                : message.status === "delivered"
                ? "Delivered (Receiver Online)"
                : "Sent (Receiver Offline)"
            }
          >
            {message.status === "seen" ? (
              <BsCheckAll className="text-sky-400 font-bold" size={17} />
            ) : message.status === "delivered" ? (
              <BsCheckAll className="text-gray-300" size={17} />
            ) : (
              <BsCheck className="text-gray-300" size={17} />
            )}
          </span>
        )}
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
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview: ${activeImage.originalName}`}
          onClick={() => {
            setActiveImage(null);
            setActiveImageSaved(false);
          }}
        >
          <header
            className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="max-w-[75vw] truncate text-sm font-medium">{activeImage.originalName}</span>
            <button
              type="button"
              onClick={() => {
                setActiveImage(null);
                setActiveImageSaved(false);
              }}
              aria-label="Close image preview"
              title="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              <BsX size={24} />
            </button>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
            <div
              className="relative flex max-h-full max-w-full items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage.url}
                alt={activeImage.originalName}
                className="max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-5rem)] object-contain rounded-lg shadow-2xl"
              />
              {!fromMe && !activeImageSaved && (
                <button
                  type="button"
                  onClick={() => saveAttachment(activeImage, activeImage.attachmentIndex)}
                  aria-label={`Save ${activeImage.originalName} as a file`}
                  title="Save as"
                  className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-xl hover:bg-emerald-400 transition transform hover:scale-105 active:scale-95"
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
    status: PropTypes.string,
  }).isRequired,
};
