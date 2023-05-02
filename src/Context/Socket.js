import React, { createContext } from "react";
import io from "socket.io-client";

export const socket = io('http://localhost:3001');
// export const socket = io(SOCKET_URL);
const SocketContext = createContext(socket);

export default SocketContext;