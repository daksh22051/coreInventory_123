#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, 'app', 'hooks');
const filePath = path.join(hooksDir, 'useSocket.ts');

const content = `"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Module-level singleton
let socket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("connect_error", (err) => {
      console.error("[useSocket] connection error:", err.message);
    });
  }
  return socket;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket>(null!);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;
    refCount++;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // Sync initial state
    setIsConnected(s.connected);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      refCount--;

      if (refCount <= 0) {
        s.disconnect();
        socket = null;
        refCount = 0;
      }
    };
  }, []);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler);
    },
    [],
  );

  const off = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.off(event, handler);
    },
    [],
  );

  const emit = useCallback(
    (event: string, ...args: unknown[]) => {
      socketRef.current?.emit(event, ...args);
    },
    [],
  );

  return { socket: socketRef.current, isConnected, on, off, emit };
}

export function useLiveRefresh(eventName: string, callback: () => void) {
  const { socket: s } = useSocket();
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!s) return;

    const handler = () => savedCallback.current();
    s.on(eventName, handler);
    return () => {
      s.off(eventName, handler);
    };
  }, [s, eventName]);
}
`;

try {
  fs.mkdirSync(hooksDir, { recursive: true });
  console.log('✓ Created directory:', hooksDir);

  fs.writeFileSync(filePath, content);
  console.log('✓ Created file:', filePath);

  // Self-cleanup
  try { fs.unlinkSync(__filename); } catch (_) {}
  const batFile = __filename.replace('.js', '.bat');
  try { fs.unlinkSync(batFile); } catch (_) {}
  console.log('✓ Cleaned up setup scripts');
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
