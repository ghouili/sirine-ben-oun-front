import React, { useEffect, useState, useRef, useContext } from "react";
import socket from "../../../Socket";
import "./Messenger.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUserFriends,
  faCommentAlt,
  faPaperPlane,
  faPaperclip
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import streamSaver from 'streamsaver';
import { SocketContext } from "../../../Context/SocketContext";
import worker from '../../../worker';

// const worker = new Worker('../../../../public/worker.js');

function Messenger({ setIsMessenger, display, roomId, peers,fileNameRef, gotFile, setGotFile  }) {
  let time = moment(new Date()).format("hh:mm A");
  const { chat } = useContext(SocketContext);
  const currentUser = sessionStorage.getItem("user");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const messagesEndRef = useRef(null);
  // const peerRef = useRef();

  
  
  const download = async () =>  {
    setGotFile(false);
    worker.postMessage('download');
    worker.addEventListener('message', event => {
      const stream = event.data.stream();
      const fileStream = streamSaver.createWriteStream(fileNameRef.current);
      stream.pipeTo(fileStream)
    } )
  }
  
  const selectFile = async (e) =>  {
    setFile(e.target.files[0]);
    
  }
  
  const sendFile = async (e) =>  {

    console.log(peers);
    peers.forEach(( item ) => {
      
      const peer = item.current;
      // converte file into a stream::
      const stream = file.stream();
  
      const reader = stream.getReader();
  
      reader.read().then(obj => {
        handelreading(obj.done, obj.value);
      });
  
      function handelreading (value, done) {
        if (done) {
          peer.write(JSON.stringify({done: true, fileName: file.name}));
          return;
          
        }
  
        peer.write(value);
        reader.read().the(obj => {
          handelreading(obj.done, obj.value);
        })
      }
    });

  }


  // Scroll to Bottom of Message List
  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {

    if(file) {   sendFile(); }
    if (text !== "") {
      socket.emit("BE-send-message", {
        roomId,
        msg: text,
        sender: currentUser,
        time,
      });
      setText("");
    }
  };

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <h3>Meeting details</h3>
        <FontAwesomeIcon
          className="icon"
          icon={faTimes}
          onClick={() => {
            setIsMessenger(false);
          }}
        />
      </div>

      <div className="messenger-header-tabs">
        <div className="tab">
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
          <p>People (1)</p>
        </div>
        <div className="tab active">
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          <p>Chat</p>
        </div>
      </div>

      <div className="chat-section">
        {chat &&
          chat.map(({ sender, msg, time, pdf }, idx) => {
            console.log('messae    ' + msg);
            return (
              <div key={idx} className="chat-block">
                {gotFile && 
                  <div>
                  <span>You have received a file. Would you like to download the file?</span>
                  <button onClick={download}>Yes</button>
                  </div>
                }
                <div className="sender">
                  {sender} <small>{time}</small>
                </div>
                {/* <p className="msg">here commes an actual msg </p> */}
                {pdf ?
                  <p className="msg">pdf </p>
                :
                  <p className="msg">{msg} </p>
                }
                
              </div>
            );
          })}

          {gotFile && 
          <div>
              <span>You have received a file. Would you like to download the file?</span>
              <button onClick={download}>Yes</button>
          </div>
          }
        <div style={{ float: "left", clear: "both" }} ref={messagesEndRef} />
      </div>

      <div className="send-msg-section">
        <input
          placeholder="Send a message to everyone"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="w-fit">
          <input  
            onChange={selectFile} 
            type='file'
            className="hidden"
            id="attache_file"
          />
          <label htmlFor="attache_file" className="cursor-pointer">
            <FontAwesomeIcon className="icon" icon={faPaperclip} />
          </label>
        </div>
        <div onClick={sendMessage}>
          <FontAwesomeIcon className="icon" icon={faPaperPlane} />
        </div>
      </div>
    </div>
  );
}

export default Messenger;
