import { createContext, useState, useEffect, useContext, useRef } from "react";
import PropTypes from "prop-types";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? window.location.origin
    : "http://localhost:5000");

const getCookie = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const { authUser } = useAuthContext();

  useEffect(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setOnlineUsers([]);

    if (!authUser) {
      setSocket(null);
      return;
    }

    const token = getCookie("jwt");
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("presence", ({ userId, online }) => {
      setOnlineUsers((users) => {
        if (online) return users.includes(userId) ? users : [...users, userId];
        return users.filter((id) => id !== userId);
      });
    });

    return () => {
      newSocket.close();
      if (socketRef.current === newSocket) socketRef.current = null;
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
