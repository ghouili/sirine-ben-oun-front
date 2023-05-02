import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserFriends,
  faCommentAlt,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";

import "./CallPageHeader.scss";
import moment from "moment";
function CallPageHeader({
  isMessenger,
  setIsMessenger,
  messageAlert,
  setMessageAlert,
}) {
  let time = moment(new Date()).format("hh:mm A");

  return (
    <div className="frame-header">
      {/* <div className="header-items icon-block">
        <FontAwesomeIcon className="icon" icon={faUserFriends} />
      </div> */}
      <div
        className="header-items icon-block"
        onClick={() => {
          setIsMessenger(true);
          setMessageAlert({});
        }}
      >
        <FontAwesomeIcon className="icon" icon={faCommentAlt} />
        {/* <span className="alert-circle-icon"></span> */}
      </div>
      <div className="header-items date-block">{time}</div>
      <div className="header-items icon-block">
        <FontAwesomeIcon className="icon profile" icon={faUserCircle} />
      </div>
    </div>
  );
}

export default CallPageHeader;
