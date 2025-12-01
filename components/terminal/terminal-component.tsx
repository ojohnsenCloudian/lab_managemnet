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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          terminal.write(text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        terminal.write(`\r\n\x1b[31mError: ${err instanceof Error ? err.message : "Connection failed"}\x1b[0m\r\n`);
      }
    };

    connect();

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
      if (connected) {
        fetch(`/api/ssh/close/${credentialId}`, { method: "POST" });
      }
    };
  }, [credentialId, connected]);

  if (error) {
    return (
      <div className="border rounded-md p-4 bg-destructive/10 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-background">
      <div className="p-2 border-b bg-muted/50 text-sm">
        SSH Terminal {connected ? "(Connected)" : "(Connecting...)"}
      </div>
      <div ref={terminalRef} className="p-4 min-h-[400px]" />
    </div>
  );
}
