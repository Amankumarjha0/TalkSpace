import { useState, useRef, useEffect } from "react";
import { BsEmojiSmile, BsFileEarmark, BsFileEarmarkPdf, BsPaperclip, BsSend, BsX } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";

import useSendMessage from "../../hooks/useSendMessage";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;

const formatFileSize = (size) => `${(size / (1024 * 1024)).toFixed(1)} MB`;

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { loading, sendMessage } = useSendMessage();

  const emojiPickerRef = useRef();
  const attachmentEmojiPickerRef = useRef();
  const emojiButtonRef = useRef();
  const attachmentEmojiButtonRef = useRef();
  const fileInputRef = useRef();
  const attachmentsRef = useRef([]);

  const updateAttachments = (attachments) => {
    attachmentsRef.current = attachments;
    setSelectedAttachments(attachments);
  };

  const releasePreviews = (attachments) => {
    attachments.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideEmojiControls = [
        emojiPickerRef.current,
        attachmentEmojiPickerRef.current,
        emojiButtonRef.current,
        attachmentEmojiButtonRef.current,
      ].some((element) => element?.contains(event.target));

      if (!clickedInsideEmojiControls) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => () => releasePreviews(attachmentsRef.current), []);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = MAX_ATTACHMENTS - selectedAttachments.length;

    if (files.length > availableSlots) {
      toast.error("You can attach up to 5 files per message");
    }

    const accepted = [];
    files.slice(0, availableSlots).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} exceeds the 1.5 MB image limit`);
        return;
      }
      if (!isImage && file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 5 MB document limit`);
        return;
      }
      accepted.push({
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : "",
      });
    });

    if (accepted.length) {
      updateAttachments([...selectedAttachments, ...accepted]);
      setActiveAttachmentIndex(selectedAttachments.length);
      setShowEmojiPicker(false);
    }
    event.target.value = "";
  };

  const handleRemoveAttachment = (previewUrl, index) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const remainingAttachments = selectedAttachments.filter((_, itemIndex) => itemIndex !== index);
    updateAttachments(remainingAttachments);
    setActiveAttachmentIndex((currentIndex) => Math.min(
      currentIndex > index ? currentIndex - 1 : currentIndex,
      Math.max(remainingAttachments.length - 1, 0)
    ));
    if (!remainingAttachments.length) setShowEmojiPicker(false);
  };

  const discardAttachments = () => {
    releasePreviews(selectedAttachments);
    updateAttachments([]);
    setActiveAttachmentIndex(0);
    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedAttachments.length) return;
    const sent = await sendMessage(message.trim(), selectedAttachments.map(({ file }) => file));
    if (!sent) return;

    setMessage("");
    releasePreviews(selectedAttachments);
    updateAttachments([]);
    setActiveAttachmentIndex(0);
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((currentMessage) => currentMessage + (emojiData?.emoji || ""));
  };

  return (
    <>
      <form className="shrink-0 sticky bottom-0 z-20 bg-[#0a0a0a] my-2 px-3 sm:my-3 sm:px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]" onSubmit={handleSubmit}>
        <div className="relative w-full">
          <input
            type="text"
            className="h-12 w-full rounded border border-[#3f3f41] bg-[#000000] px-20 text-[#F6F6F6] outline-none placeholder-[#eaeaeab9] sm:h-14 sm:px-24"
            placeholder="Type a message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleAttachmentChange}
            className="sr-only"
            aria-label="Choose attachments"
          />
          <button
            type="button"
            aria-label="Attach files"
            title="Attach files"
            className="absolute inset-y-0 left-2 flex items-center justify-center text-gray-300 hover:text-white sm:left-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <BsPaperclip size={20} />
          </button>
          <button
            type="button"
            aria-label="Choose emoji"
            className="absolute inset-y-0 left-10 flex cursor-pointer items-center justify-center sm:left-12"
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker((visible) => !visible)}
          >
            <BsEmojiSmile size={22} />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            disabled={loading || selectedAttachments.length > 0}
          >
            {loading ? <span className="loading loading-spinner mx-auto"></span> : <BsSend />}
          </button>
          {showEmojiPicker && selectedAttachments.length === 0 && (
            <div
              className="absolute bottom-16 right-0 z-20 max-w-[calc(100vw-1.5rem)]"
              ref={emojiPickerRef}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                emojiStyle="apple"
                width="min(350px, calc(100vw - 1.5rem))"
                autoFocusSearch={false}
                lazyLoadEmojis={true}
                disableSearchBar={false}
                disableSkinTonePicker={true}
                skinTonesDisabled={false}
                searchDisabled={false}
              />
            </div>
          )}
        </div>
      </form>

      {selectedAttachments.length > 0 && (
        <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col bg-[#141414] text-white" role="dialog" aria-modal="true" aria-label="Preview attachments">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
            <span className="max-w-[75vw] truncate text-sm text-gray-300">
              {selectedAttachments[activeAttachmentIndex]?.file.name}
            </span>
            <button
              type="button"
              onClick={discardAttachments}
              aria-label="Cancel attachment"
              title="Cancel"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <BsX size={26} />
            </button>
          </header>

          <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-5 sm:px-8">
            {selectedAttachments[activeAttachmentIndex]?.previewUrl ? (
              <img
                src={selectedAttachments[activeAttachmentIndex].previewUrl}
                alt={selectedAttachments[activeAttachmentIndex].file.name}
                className="max-h-[60vh] max-w-[min(82vw,40rem)] rounded object-contain"
              />
            ) : (
              <div className="flex max-w-full flex-col items-center gap-4 px-6 text-center">
                {selectedAttachments[activeAttachmentIndex]?.file.type === "application/pdf"
                  ? <BsFileEarmarkPdf aria-hidden="true" className="text-red-400" size={88} />
                  : <BsFileEarmark aria-hidden="true" className="text-gray-300" size={88} />}
                <div className="max-w-full">
                  <p className="max-w-[min(80vw,36rem)] break-words text-lg font-medium">
                    {selectedAttachments[activeAttachmentIndex]?.file.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {selectedAttachments[activeAttachmentIndex]?.file.type || "File"} · {formatFileSize(selectedAttachments[activeAttachmentIndex]?.file.size || 0)}
                  </p>
                </div>
              </div>
            )}
          </main>

          {selectedAttachments.length > 1 && (
            <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pb-3">
              {selectedAttachments.map(({ file, previewUrl }, index) => (
                <div key={`${file.name}-${file.lastModified}-${index}`} className={`flex shrink-0 items-center gap-1 rounded border ${index === activeAttachmentIndex ? "border-pink-400 bg-white/10" : "border-white/10 bg-black/20"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveAttachmentIndex(index)}
                    aria-label={`Preview ${file.name}`}
                    aria-current={index === activeAttachmentIndex ? "true" : undefined}
                    className="flex h-12 max-w-36 items-center gap-2 px-2"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      file.type === "application/pdf"
                        ? <BsFileEarmarkPdf className="shrink-0 text-red-400" size={18} />
                        : <BsFileEarmark className="shrink-0 text-gray-300" size={18} />
                    )}
                    <span className="max-w-24 truncate text-xs text-gray-300">{file.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(previewUrl, index)}
                    aria-label={`Remove ${file.name}`}
                    title="Remove attachment"
                    className="mr-1 flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <BsX size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 px-3 py-4 sm:px-6">
            <div className="relative mx-auto flex h-12 max-w-3xl items-center gap-2 rounded-lg bg-[#292929] px-3 sm:h-14">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Add a message"
                aria-label="Add a caption"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker((visible) => !visible)}
                aria-label="Choose emoji"
                title="Choose emoji"
                ref={attachmentEmojiButtonRef}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <BsEmojiSmile size={20} />
              </button>
              <button
                type="submit"
                disabled={loading}
                aria-label="Send attachment"
                title="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-60 sm:h-11 sm:w-11"
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : <BsSend size={18} />}
              </button>
              {showEmojiPicker && (
                <div ref={attachmentEmojiPickerRef} className="absolute bottom-14 right-0 z-20 max-w-[calc(100vw-1.5rem)]">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme="dark"
                    emojiStyle="apple"
                    width="min(350px, calc(100vw - 1.5rem))"
                    autoFocusSearch={false}
                    lazyLoadEmojis={true}
                    disableSearchBar={false}
                    disableSkinTonePicker={true}
                    skinTonesDisabled={false}
                    searchDisabled={false}
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default MessageInput;
