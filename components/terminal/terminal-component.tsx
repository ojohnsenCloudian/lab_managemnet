"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalComponentProps {
  credentialId: string;
}

export function TerminalComponent({ credentialId }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: "transparent",
        foreground: "#d4d4d8",
      },
      fontSize: 14,
      fontFamily: "monospace",
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;

    // Connect to SSH
    const connect = async () => {
      try {
        const response = await fetch(`/api/ssh/connect/${credentialId}`);
        if (!response.ok) {
          throw new Error("Failed to connect");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        setConnected(true);

        // Read from stream
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = decoder.decode(value);
              terminal.write(text);
            }
          } catch (err) {
            console.error("Error reading stream:", err);
            terminal.write("\r\n\r\nConnection closed.\r\n");
            setConnected(false);
          }
        };

        readStream();

        // Send input to server
        terminal.onData((data) => {
          fetch(`/api/ssh/input/${credentialId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
          }).catch((err) => {
            console.error("Error sending input:", err);
          });
        });
      } catch (err) {
        setError("Failed to connect to SSH server");
        console.error("SSH connection error:", err);
      }
    };

    connect();

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
      // Close SSH connection
      fetch(`/api/ssh/close/${credentialId}`, { method: "POST" }).catch(
        console.error
      );
    };
  }, [credentialId]);

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-500"
          }`}
        />
        <span className="text-muted-foreground">
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>
      <div
        ref={terminalRef}
        className="bg-black rounded-md p-4 min-h-[400px]"
      />
    </div>
  );
}

