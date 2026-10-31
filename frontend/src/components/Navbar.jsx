import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, PlusCircle, KeyRound, Lock, Menu, X, Shield } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";
import VeiloLogo from "./VeiloLogo";

export default function Navbar({ isConnected, isConnecting, alias }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/random", label: "Random Chat", icon: MessageSquare },
    { to: "/private", label: "Create Room", icon: PlusCircle },
    { to: "/join", label: "Join Code", icon: KeyRound },
    { to: "/privacy", label: "Privacy", icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center group hover:opacity-95 transition-opacity shrink-0">
          <VeiloLogo size="sm" showTagline={true} />
        </Link>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/60 p-1 rounded-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side items: Status, Alias, Mobile Menu button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />

          {/* Anonymous User Alias Badge */}
          <div
            title="Your anonymous session handle"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="font-medium truncate max-w-[100px]">{alias || "Guest"}</span>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in shadow-2xl">
          {/* User Handle Banner on Mobile */}
          <div className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono text-slate-300">
            <span className="text-slate-400">Anonymous Handle:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {alias || "Guest"}
            </span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/90 text-cyan-400 border border-slate-700/60 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
