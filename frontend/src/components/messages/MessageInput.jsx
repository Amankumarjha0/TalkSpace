import { useState, useRef, useEffect } from "react";
import { BsEmojiSmile, BsSend } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";

import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { loading, sendMessage } = useSendMessage();

  const emojiPickerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) return;
    await sendMessage(message);
    setMessage("");
  };

  const handleEmojiClick = (emojiData, event) => {
    setMessage(message + emojiData?.emoji);
    // console.log(emojiData);
  };

  return (
    <form className="my-2 shrink-0 px-3 sm:my-3 sm:px-4" onSubmit={handleSubmit}>
      <div className="w-full relative">
        <input
          type="text"
          className="h-12 w-full rounded border border-[#3f3f41] bg-[#000000] px-12 text-[#F6F6F6] outline-none placeholder-[#eaeaeab9] sm:h-14 sm:px-14"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="button"
          aria-label="Choose emoji"
          className="absolute inset-y-0 left-3 flex cursor-pointer items-center justify-center sm:left-4"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <BsEmojiSmile size={22} />
        </button>
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner mx-auto"></span>
          ) : (
            <BsSend />
          )}
        </button>
        {showEmojiPicker && (
          <div
            className="absolute bottom-16 right-0 z-20 max-w-[calc(100vw-1.5rem)]"
            ref={emojiPickerRef}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              // disableSearchBar
              // disableSkinTonePicker
              // height={500}
              // width={500}
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
  );
};

export default MessageInput;
