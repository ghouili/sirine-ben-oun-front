import React from 'react';
import { Navigate } from 'react-router-dom';

const Check = ({ children }) => {
    let email = localStorage.getItem('room');
    let room = localStorage.getItem('email');

    if (email && room ) {
        return children;
    } else {
        return <Navigate to='/' replace  />;
    }
}

export default Check