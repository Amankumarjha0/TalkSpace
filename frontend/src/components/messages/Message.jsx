import { useAuthContext } from "../../context/AuthContext";

const Message = ({ message }) => {
  const { authUser } = useAuthContext();

  const fromMe = message.senderId === authUser._id;

  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const bubbleBgColor = fromMe ? "bg-[#212020] border border-white/10" : "";
  const shakeClass = message.shouldShake ? "shake" : "";

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

  return (
    <div className={`chat ${chatClassName}`}>
      <div
        className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}
      >
        {message.message}
      </div>
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
        {formattedTime}
      </div>
    </div>
  );
};

export default Message;
