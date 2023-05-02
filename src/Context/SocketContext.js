import React, { createContext, useState, useEffect } from "react";
import socket from "../Socket";

const SocketContext = createContext();

const ProvideContext = ({ children }) => {
  const [chat, setChat] = useState([]);
  useEffect(() => {
    // listening on incomming messages ::
    socket.on("FE-receive-message", ({ msg, sender, time }) => {
      setChat((chat) => [...chat, { msg, sender, time }]);
      // console.log(chat);
    });
  }, []);

  return (
    <SocketContext.Provider value={{ chat }}>{children}</SocketContext.Provider>
  );
};
export { SocketContext, ProvideContext };
