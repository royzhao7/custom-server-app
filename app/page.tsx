"use client";
import { useEffect } from "react";
import "./xterm.css";
import { Terminal } from "@xterm/xterm";
import { AttachAddon } from "@xterm/addon-attach";

export default function Home() {
  useEffect(() => {
    var term = new Terminal({
      cursorBlink: true,
    });

    const headlineElement = document.getElementById("terminal");
    if (headlineElement) {
      term.open(headlineElement);
    }

    const socketProtocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${socketProtocol}//${window.location.host}`;
    console.log("socketUrl:" + socketUrl);
    const socket = new WebSocket(socketUrl);
    socket.onmessage = (event) => {
      term.write(event.data);
  }
  }, []);
  return <div id="terminal"></div>;
}
