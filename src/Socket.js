import io from 'socket.io-client';

const socket = io.connect('http://localhost:3001');
console.log(socket);
socket.on('connect_error', error => {
  console.error('Socket.IO connection error:', error);
});

export default socket;