import './App.css';

import React, { useState, useEffect } from 'react';
import socketIO from 'socket.io-client';

const serverHost ="estroom9.alwaysdata.net";
const socket = socketIO(serverHost);
//const socket = socketIO.connect('http://localhost:4000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);

  useEffect(() => {
    //#region  default
    socket.on('connect', () => {
      setIsConnected(true);
      console.log("connected");
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log("disconnected");
    });
    //#endregion

    socket.on('pong', (data) => {
      console.log("pong >> ", data);
      setLastPong(new Date().toISOString());
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  const disconnect = () => {
    socket.disconnect();
  }

  const connect = () => {
    socket.connect();
  }

  const message = () => {
    console.log("first")
    socket.emit("message", "hello");
  }

  return (
    <div className="App">
      <div>
      <p>Connected: { '' + isConnected }</p>
      <p>Last pong: { lastPong || '-' }</p>
      <button onClick={ connect }>Connect</button>
      <button onClick={ message }>Message</button>
      <button onClick={ disconnect }>Disconnect</button>
      </div>
    </div>
  );
}

export default App;
