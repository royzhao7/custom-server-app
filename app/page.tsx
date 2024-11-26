"use client";
import { useEffect, useState } from "react";
import "./xterm.css";
import { Terminal } from "@xterm/xterm";
import { socketio } from "./socket";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  useEffect(() => {
    if (socketio.connected) {
      onConnect();
    }
    function onConnect() {
      console.log("socket io connect");

      setIsConnected(true);
      setTransport(socketio.io.engine.transport.name);

      socketio.io.engine.on("upgrade", (transport) => {
        console.log("socket io engine upgrade");
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      console.log("socket io disconnect");
      setIsConnected(false);
      setTransport("N/A");
    }

    socketio.on("connect", onConnect);
    socketio.on("disconnect", onDisconnect);

    var term = new Terminal({
      cursorBlink: true,
    });

    const headlineElement = document.getElementById("terminal");
    if (headlineElement) {
      term.open(headlineElement);
    }

    socketio.on("message", (value) => {
      // ...
      term.write(value);
    });

    function init() {
      // if (term._initialized) {
      //     return;
      // }
      // term._initialized = true;
      // term.prompt = () => {
      //     runCommand('\n');
      // };
      // setTimeout(() => {
      //     term.prompt();
      // }, 300);

      term.onKey((keyObj) => {
        console.log(keyObj);
        runCommand(keyObj.key);
      });

      term.attachCustomKeyEventHandler((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          navigator.clipboard.readText().then((text) => {
            runCommand(text);
          });
          return false;
        }
        return true;
      });
    }
    function runCommand(command) {
      console.log(command);
      socketio.emit("message", command);
    }
    init();

    return () => {
      socketio.off("connect", onConnect);
      socketio.off("disconnect", onDisconnect);
    };
  }, []);
  return <div id="terminal"></div>;
}
