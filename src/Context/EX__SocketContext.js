import React, { createContext, useState, useEffect, useRef } from 'react'
import Peer from 'simple-peer';

import SocketContext, {socket} from './Socket';

// const SocketContext = createContext();

const ProvideContext = ({ children }) => {
    // connecting to ouser server ::
    // const socket = io.connect('http://localhost:4000');
    // user info :::
    const [auth, setAuth] = useState({nom: 'mohammed'})
    // chat arrey that we gonna display in the chat :::
    const [chat, setChat] = useState([]);
    // room id :::
    const [roomId, setRoomId] = useState('');
    //other users peers ::::
    const [peers, setPeers] = useState([]);
    // local user data ::::
    const [userVideoAudio, setUserVideoAudio] = useState({
      localUser: { video: true, audio: true },
    });
    // current stream :
    const [stream, setStream] = useState();

    // the ref that we gonna share the video and audio stream on ::
    const peersRef = useRef([]);
    // my stream::
    const myVideo = useRef();

    useEffect(() => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        //passing the media stream to the ref uservideo
        myVideo.current.srcObject = currentStream;
      });
    
    }, [ ]);

    useEffect(() => {
      if (localStorage.getItem('room')){
        setRoomId(localStorage.getItem('room'));
        setAuth({
          nom: localStorage.getItem('email'),
        });
      }

    }, [ ]);
    
    useEffect(() => {
      
      // listening on users that joining the room  the room ::::
      // whenever a user join we get all users data :::::
      socket.on('Users-Joinned', (users) => {

        const peers = [];
        let room_id =localStorage.getItem('room');
        let user_name =localStorage.getItem('email');
        users.forEach(({ userId, userName, video, audio, room  }) => {

          if (userName !==  user_name ){
            if (room ===  room_id ){

              const peer = createPeer(userId, socket.id, stream);
              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          }
        });
        setPeers(users);

      });

      //recieving calls data ::
      socket.on('receiving-call', ({ signal, from, info }) => {
        let { userName, video, audio } = info;

        const peerIdx = findPeer(from);

        if (!peerIdx) {
          const peer = addPeer(signal, from, stream);

          peer.userName = userName;

          peersRef.current.push({
            peerID: from,
            peer,
            userName: userName,
          });
          
          setPeers((users) => {
            return [...users, peer];
          });

          setUserVideoAudio((preList) => {
            return {
              ...preList,
              [peer.userName]: { video, audio },
            };
          });
        }
      });

      // adding signal when the peer is accepted:::
      socket.on('call-accepted', ({ signal, answerId }) => {
        const peerIdx = findPeer(answerId);
        peerIdx.peer.signal(signal);
        // console.log(peerIdx);
      });
        
    }, [ peers ]);

    //recieving messages::
    useEffect(() => {
      // listening on incomming messages ::
      socket.on('message', ({name, message, time}) => {
        setChat((chat) =>[ ...chat, { name, message, time } ]);
        // console.log(chat);
      })
      console.log('message came');
    }, [ socket ]);

    // creating Peer::::
    function createPeer(userId, caller, stream) {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });
      peer.on('signal', (signal) => {
        // calling every user in the room :::::
        socket.emit('calling-users-room', {
          userToCall: userId,
          from: caller,
          signal,
        });
      });
      peer.on('disconnect', () => {
        peer.destroy();
      });
  
      return peer;
    }

    // finding the peer ::::
    function findPeer(id) {
      return peersRef.current.find((p) => p.peerID === id);
    }

    // add the peer and accept the call ::::

    function addPeer(incomingSignal, callerId, stream) {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });
  
      peer.on('signal', (signal) => {
        socket.emit('Accepting-call', { signal, to: callerId });
      });
  
      peer.on('disconnect', () => {
        peer.destroy();
      });
  
      peer.signal(incomingSignal);
  
      return peer;
    }

    // fn that send message ::
    const sendMessage = ( message, time   ) => {
      socket.emit('message', { roomId, name: auth.nom, message, time });
    }
    
    // fn that joins a room ::
    const joinRoom = ( room ) => {
      socket.emit('join_room', { roomId: room, userName: auth.nom});
    }

  return (
    <SocketContext.Provider 
        value={{
          socket,
          chat,
          roomId,
          peers,
          setAuth,
          setRoomId,
          sendMessage,
          joinRoom,
        }}
    >
        {children}
    </SocketContext.Provider>
  )
}

export  { SocketContext, ProvideContext }