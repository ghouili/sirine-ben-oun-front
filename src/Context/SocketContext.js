import React, { createContext, useState, useEffect } from "react";
import socket from "../Socket";

const SocketContext = createContext();

const ProvideContext = ({ children }) => {
  const [chat, setChat] = useState([]);
  useEffect(() => {
    // listening on incomming messages ::
    console.log('here 01');
    socket.on("FE-receive-message", ({ msg, sender, time }) => {
      console.log('here 02');
      setChat((chat) => [...chat, { msg, sender, time }]);
      // console.log(chat);
    });
    console.log('here 03');
  }, []);

  return (
    <SocketContext.Provider value={{ chat }}>{children}</SocketContext.Provider>
  );
};
export { SocketContext, ProvideContext };
