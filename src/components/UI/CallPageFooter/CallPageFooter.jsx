import React, { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useReactMediaRecorder } from "react-media-recorder";

import {
  faVideo,
  faMicrophone,
  faPhone,
  faAngleUp,
  faClosedCaptioning,
  faDesktop,
  faMicrophoneSlash,
  faVideoSlash,
  faRecordVinyl,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import "./CallPageFooter.scss";

function CallPageFooter({
  clickChat,
  clickCameraDevice,
  goToBack,
  toggleAudio,
  toggleCamera,
  userVideoAudio,
  clickScreenSharing,
  screenShare,
  videoDevices,
  showVideoDevices,
  setShowVideoDevices,
}) {
  const [showModal, setShowModal] = React.useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ screen: true, type: "video/mp4" });

  console.log(status);

  React.useEffect(() => {
    if (status === "stopping") {
      return setShowModal(true);
    } else {
      return;
    }
  }, [status]);

  return (
    <div className="footer-item">
      <div className="left-item">
        <div className="icon-block">
          Meeting details
          <FontAwesomeIcon className="icon" icon={faAngleUp} />
        </div>
      </div>
      <div className="center-item">
        <div className="icon-block" onClick={toggleAudio}>
          {userVideoAudio.audio ? (
            <FontAwesomeIcon className="icon " icon={faMicrophone} />
          ) : (
            <FontAwesomeIcon className="icon " icon={faMicrophoneSlash} />
          )}
        </div>
        <div className="icon-block" onClick={goToBack}>
          <FontAwesomeIcon className="icon red" icon={faPhone} />
        </div>
        <div className="icon-block" onClick={toggleCamera}>
          {userVideoAudio.video ? (
            <FontAwesomeIcon className="icon" icon={faVideo} />
          ) : (
            <FontAwesomeIcon className="icon" icon={faVideoSlash} />
          )}
        </div>
      </div>
      <div className="right-item">
        {status !== "recording" ? (
          <div className="icon-block">
            <FontAwesomeIcon
              className="icon red"
              icon={faRecordVinyl}
              onClick={startRecording}
            />
            <p className="title">Start Recording</p>
          </div>
        ) : (
          <div className="icon-block">
            <FontAwesomeIcon
              className="icon red "
              icon={faStop}
              onClick={stopRecording}
            />
            <p className="title">Stop Recording</p>
          </div>
        )}

        <div className="icon-block" onClick={clickScreenSharing}>
          <FontAwesomeIcon className="icon red" icon={faDesktop} />
          <p className="title">Present now</p>
        </div>
      </div>

      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                  <h3 className="text-3xl font-semibold">Video Recorded</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div
                  className=" flex justify-center items-center"
                  style={{ width: "50vw", height: "40vh" }}
                >
                  <video src={mediaBlobUrl} controls autoPlay loop />
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end pt-10 border-t border-solid border-slate-200 rounded-b mt-5">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </div>
  );
}

export default CallPageFooter;
