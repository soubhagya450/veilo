import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSocket } from "./hooks/useSocket";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RandomChat from "./pages/RandomChat";
import PrivateChat from "./pages/PrivateChat";
import JoinRoom from "./pages/JoinRoom";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

export default function App() {
  const { isConnected, isConnecting, alias, connect } = useSocket();

  // Auto-connect socket when app launches
  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans">
        <Navbar isConnected={isConnected} isConnecting={isConnecting} alias={alias} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/random" element={<RandomChat />} />
            <Route path="/private" element={<PrivateChat />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
