'use client';
import { useEffect } from 'react';
import './xterm.css'
import { Terminal } from '@xterm/xterm';

export default function Home() {
  useEffect(() => {
  var term = new Terminal({
    cursorBlink: true
});
const headlineElement = document.getElementById('terminal');
if (headlineElement) {
    term.open(headlineElement);
}
  },[])
  return (
    <div id="terminal"></div>
  );
}
