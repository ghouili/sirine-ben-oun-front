import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  // faVideo,
  // faMicrophone,
  // faPhone,
  // faAngleUp,
  // faClosedCaptioning,
  // faDesktop,
  // faMicrophoneSlash,
  faVideoSlash,
  // faRecordVinyl,
  // faStop,
} from "@fortawesome/free-solid-svg-icons";

import VideoCard from "../video/VideoCard";
import "./CallPage.scss";
import socket from "../../Socket";

import CallPageFooter from "../UI/CallPageFooter/CallPageFooter";
import CallPageHeader from "../UI/CallPageHeader/CallPageHeader";
import Messenger from "./../UI/Messenger/Messenger";
import worker from "../../worker";


// function loadWebWorker(worker) {
//   const code = worker.toString();
//   const blob = new Blob(["(" + code + ")()"]);
//   return new Worker(URL.createObjectURL(blob));
// }

// const worker = loadWebWorker(WORKER);
// const worker = new Worker('../../../public/worker.js');
function CallPage() {
  const [isMessenger, setIsMessenger] = useState(false);
  const [messageAlert, setMessageAlert] = useState({});

  const params = useParams();
  // const currentUser = sessionStorage.getItem("user");
  const currentUser = "user";
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = params.id;

  const [gotFile, setGotFile] = useState("");
  const fileNameRef = useRef();

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(filtered);
    });

    // Set Back Button Event
    window.addEventListener("popstate", goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit("BE-join-room", { roomId, userName: currentUser });

        socket.on("FE-user-join", (users) => {
          // all users
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;

            if (userName !== currentUser) {
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
          });

          setPeers(peers);
        });

        socket.on("FE-receive-call", ({ signal, from, info }) => {
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

        socket.on("FE-call-accepted", ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          peerIdx.peer.signal(signal);
        });

        socket.on("FE-user-leave", ({ userId, userName }) => {
          // console.log('left  ' + userName);
          const peerIdx = findPeer(userId);
          peerIdx.peer.destroy();
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== peerIdx.peer.peerID);
            return [...users];
          });
          peersRef.current = peersRef.current.filter(
            ({ peerID }) => peerID !== userId
          );
        });
      });

    socket.on("FE-toggle-camera", ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);

      setUserVideoAudio((preList) => {
        let video = preList[peerIdx.userName].video;
        let audio = preList[peerIdx.userName].audio;

        if (switchTarget === "video") video = !video;
        else audio = !audio;

        return {
          ...preList,
          [peerIdx.userName]: { video, audio },
        };
      });
    });

    // return () => {
    //   socket.disconnect();
    // };

    console.log('peers ::::');
    console.log(peers);
  }, [socket]);

  const handelReceivingData = async (data) => {
    if (data.toString().includes("done")) {
      setGotFile(true);

      const parse = JSON.parse(data);
      fileNameRef.current = parse.fileNAme;
    } else {
      worker.postMessage(data);
    }
  };

  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-call-user", {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on("data", handelReceivingData);

    peer.on("disconnect", () => {
      peer.destroy();
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-accept-call", { signal, to: callerId });
    });

    peer.on("data", handelReceivingData);

    peer.on("disconnect", () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  // Open Chat
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };

  // BackButton
  const goToBack = (e) => {
    e.preventDefault();
    socket.emit("BE-leave-room", { roomId, leaver: currentUser });
    sessionStorage.removeItem("user");
    window.location.href = "/homepage";
  };

  const toggleCamera = (e) => {
    setUserVideoAudio((preList) => {
      let videoSwitch = preList["localUser"].video;
      let audioSwitch = preList["localUser"].audio;

      const userVideoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
      videoSwitch = !videoSwitch;
      userVideoTrack.enabled = videoSwitch;

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit("BE-toggle-camera-audio", { roomId, switchTarget: "video" });
  };

  const toggleAudio = (e) => {
    setUserVideoAudio((preList) => {
      let videoSwitch = preList["localUser"].video;
      let audioSwitch = preList["localUser"].audio;

      const userAudioTrack = userVideoRef.current.srcObject.getAudioTracks()[0];
      audioSwitch = !audioSwitch;

      if (userAudioTrack) {
        userAudioTrack.enabled = audioSwitch;
      } else {
        userStream.current.getAudioTracks()[0].enabled = audioSwitch;
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit("BE-toggle-camera-audio", { roomId, switchTarget: "audio" });
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      console.log(screenShare);
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === "video"),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === "video"),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  const expandScreen = (e) => {
    const elem = e.target;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  const clickBackground = () => {
    if (!showVideoDevices) return;

    setShowVideoDevices(false);
  };

  const clickCameraDevice = (event) => {
    if (
      event &&
      event.target &&
      event.target.dataset &&
      event.target.dataset.value
    ) {
      const deviceId = event.target.dataset.value;
      const enabledAudio =
        userVideoRef.current.srcObject.getAudioTracks()[0].enabled;

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId }, audio: enabledAudio })
        .then((stream) => {
          const newStreamTrack = stream
            .getTracks()
            .find((track) => track.kind === "video");
          const oldStreamTrack = userStream.current
            .getTracks()
            .find((track) => track.kind === "video");

          userStream.current.removeTrack(oldStreamTrack);
          userStream.current.addTrack(newStreamTrack);

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              oldStreamTrack,
              newStreamTrack,
              userStream.current
            );
          });
        });
    }
  };
  console.log(userVideoAudio);
  return (
    <div className="callpage-container w-screen" onClick={clickBackground}>
      <div
        className={` w-full h-full grid gap-4 bg-black  pb-28 p-4 ${
          peers.length === 0
            ? "grid-cols-1"
            : peers.length === 1
            ? "grid-cols-2"
            : peers.length === 2
            ? "grid-cols-3"
            : peers.length === 3
            ? "grid-cols-4"
            : peers.length === 4
            ? "grid-cols-3"
            : `grid-cols-${peers.length + (1 % 2)}`
        }  `}
        style={{ maxHeight: "90vh", minHeight: "90vh" }}
      >
        <div
          className={`w-full h-full flex  flex-col rounded justify-center items-center  ${
            userVideoAudio.localUser.video ? null : "border-4 border-gray-50"
          }`}
        >
          {userVideoAudio.localUser.video ? null : (
            <div className="w-full flex justify-end text-white ">
              <FontAwesomeIcon
                className="mt-6 mr-6 text-red-700 text-2xl"
                icon={faVideoSlash}
              />
            </div>
          )}

          <video
            className={`rounded m-auto ${
              userVideoAudio.localUser.video ? null : "hidden"
            }`}
            src=""
            playsInline
            autoPlay
            muted
            onClick={expandScreen}
            ref={userVideoRef}
          />
          {userVideoAudio.localUser.video ? null : (
            <div className="rounded-full w-36 h-36 m-auto flex justify-center items-center border-4 border-gray-50 text-2xl text-white font-mono bg-blue-600 ">
              {currentUser}
            </div>
          )}
        </div>
        {peers &&
          peers.map((peer, idx, arr) => {
            // console.log(userVideoAudio[peer.userName].video);
            let video = userVideoAudio[peer.userName];
            if (video) {
              console.log(video.video);
            }

            return (
              <div
                key={idx}
                // className="w-full h-full flex justify-center items-center"
                className={`w-full h-full flex  flex-col rounded justify-center items-center  ${
                  video && video.video ? null : "border-4 border-gray-50"
                }`}
                onClick={expandScreen}
              >
                {video && video.video ? null : (
                  <div className="w-full flex justify-end text-white ">
                    <FontAwesomeIcon
                      className="mt-6 mr-6 text-red-700 text-2xl"
                      icon={faVideoSlash}
                    />
                  </div>
                )}
                <VideoCard videodata={video} peer={peer} number={arr.length} />
              </div>
            );
          })}
        {/* <div className="border w-full h-full border-black">
            here we go
          </div>
          {[0,1,2,3].map((item, idx) =>(
            <div  className="border w-full h-full border-black">
             here we go
           </div>
          ))} */}
      </div>

      <CallPageHeader
        isMessenger={isMessenger}
        setIsMessenger={setIsMessenger}
        messageAlert={messageAlert}
        setMessageAlert={setMessageAlert}
      />
      <CallPageFooter
        clickScreenSharing={clickScreenSharing}
        clickChat={clickChat}
        clickCameraDevice={clickCameraDevice}
        goToBack={goToBack}
        toggleCamera={toggleCamera}
        toggleAudio={toggleAudio}
        userVideoAudio={userVideoAudio["localUser"]}
        screenShare={screenShare}
        videoDevices={videoDevices}
        showVideoDevices={showVideoDevices}
        setShowVideoDevices={setShowVideoDevices}
      />
      {/* <MeetingInfo  /> */}

      {isMessenger ? (
        <Messenger
          setIsMessenger={setIsMessenger}
          display={displayChat}
          roomId={roomId}
          peers={peers}
          gotFile={gotFile}
          fileNameRef={fileNameRef}
          setGotFile={setGotFile}
        />
      ) : null}
    </div>
  );
}

export default CallPage;
