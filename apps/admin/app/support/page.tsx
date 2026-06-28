"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { X, MessageCircle, Send, Circle, User, Package, ExternalLink, ArrowLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
const WS  = API.replace(/^http/, "ws");

interface ChatMessage {
  id: string; chatId: string; sender: "customer" | "admin";
  body: string; createdAt: string;
}

interface SupportChat {
  id: string; guestName: string; guestEmail?: string; orderRef?: string;
  status: "open" | "closed"; createdAt: string; updatedAt: string;
  messages: ChatMessage[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ts_admin_token") : null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

function ChatListItem({ chat, active, onClick }: { chat: SupportChat; active: boolean; onClick: () => void }) {
  const lastMsg = chat.messages?.[chat.messages.length - 1];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-zinc-200" : "bg-zinc-100"}`}>
        <User className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-xs font-bold truncate ${active ? "text-zinc-900" : "text-zinc-700"}`}>{chat.guestName}</p>
          {chat.orderRef && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
              {chat.orderRef}
            </span>
          )}
        </div>
        <p className="text-[10px] truncate text-zinc-400">
          {lastMsg ? lastMsg.body : "No messages yet"}
        </p>
      </div>
      {chat.status === "open" && !active && (
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 shrink-0" />
      )}
    </button>
  );
}

export default function SupportPage() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<SupportChat[]>("/admin/support/chats").then(setChats).catch(() => {});

    const socket = io(`${WS}/support`, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => { setConnected(true); socket.emit("joinAdmin"); });
    socket.on("disconnect", () => setConnected(false));

    socket.on("newChat", (chat: SupportChat) => {
      setChats(prev => prev.some(c => c.id === chat.id) ? prev : [{ ...chat, messages: [] }, ...prev]);
    });

    socket.on("newMessage", (msg: ChatMessage & { chatId: string }) => {
      setChats(prev => prev.map(c =>
        c.id === msg.chatId
          ? { ...c, messages: c.messages.some(m => m.id === msg.id) ? c.messages : [...c.messages, msg], updatedAt: msg.createdAt }
          : c
      ));
      setActiveChat(prev =>
        prev?.id === msg.chatId
          ? { ...prev, messages: prev.messages.some(m => m.id === msg.id) ? prev.messages : [...prev.messages, msg] }
          : prev
      );
    });

    socket.on("chatClosed", (chat: SupportChat) => {
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, status: "closed" } : c));
      setActiveChat(prev => prev?.id === chat.id ? { ...prev, status: "closed" } : prev);
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  async function openChat(chat: SupportChat) {
    const full = await apiFetch<SupportChat>(`/support/chats/${chat.id}`);
    setActiveChat(full);
    socketRef.current?.emit("joinChat", chat.id);
  }

  function sendMessage() {
    if (!message.trim() || !activeChat) return;
    socketRef.current?.emit("sendMessage", { chatId: activeChat.id, sender: "admin", body: message.trim() });
    setMessage("");
  }

  async function closeChat(id: string) {
    await apiFetch(`/admin/support/chats/${id}/close`, { method: "PATCH" });
  }

  const uniqueChats = Array.from(new Map(chats.map(c => [c.id, c])).values());
  const openChats   = uniqueChats.filter(c => c.status === "open");
  const closedChats = uniqueChats.filter(c => c.status === "closed");

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Support & Chat</h1>
        <p className="text-sm text-zinc-500 mt-1">Respond to live customer chats in real time.</p>
      </div>

      {/* Chat panel — full width */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex h-[calc(100vh-220px)] md:h-[600px]">
        {/* Sidebar — chat list */}
        <div className={`w-full md:w-72 border-r border-zinc-200 flex flex-col shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Conversations</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">{openChats.length} open</p>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${connected ? "text-emerald-600" : "text-zinc-400"}`}>
              <Circle className={`h-2 w-2 ${connected ? "fill-emerald-500 text-emerald-500" : "fill-zinc-300 text-zinc-300"}`} />
              {connected ? "Live" : "Offline"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {openChats.length === 0 && closedChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageCircle className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No chats yet</p>
                <p className="text-[10px] text-zinc-300 mt-1">New chats appear here instantly</p>
              </div>
            )}

            {openChats.length > 0 && (
              <div className="p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1.5">Open</p>
                {openChats.map(chat => (
                  <ChatListItem key={chat.id} chat={chat} active={activeChat?.id === chat.id} onClick={() => openChat(chat)} />
                ))}
              </div>
            )}

            {closedChats.length > 0 && (
              <div className="p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1.5">Closed</p>
                {closedChats.map(chat => (
                  <ChatListItem key={chat.id} chat={chat} active={activeChat?.id === chat.id} onClick={() => openChat(chat)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        {activeChat ? (
          <div className={`flex-1 flex flex-col min-w-0 ${activeChat ? "flex" : "hidden md:flex"}`}>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 md:hidden shrink-0"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{activeChat.guestName}</p>
                  {activeChat.guestEmail && <p className="text-[10px] text-zinc-500">{activeChat.guestEmail}</p>}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${activeChat.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {activeChat.status}
                </span>
                {activeChat.orderRef && (
                  <a
                    href={`/orders?q=${encodeURIComponent(activeChat.orderRef.replace('#', ''))}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">{activeChat.orderRef}</span>
                    <ExternalLink className="h-3 w-3 text-blue-400" />
                  </a>
                )}
              </div>
              {activeChat.status === "open" && (
                <button onClick={() => closeChat(activeChat.id)} className="shrink-0 h-8 px-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1.5">
                  <X className="h-3 w-3" /> Close chat
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50">
              {activeChat.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "admin"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-white text-zinc-900 border border-zinc-200 rounded-bl-sm"
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender === "admin" ? "text-white/50" : "text-zinc-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {activeChat.status === "open" ? (
              <div className="px-4 py-3 border-t border-zinc-100 flex items-center gap-3 bg-white">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a reply…"
                  className="flex-1 h-10 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 transition-colors"
                />
                <button onClick={sendMessage} disabled={!message.trim()} className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-40 hover:bg-zinc-800 transition-colors shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-zinc-100 text-center text-xs text-zinc-400 font-medium bg-white">
                This chat is closed
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-zinc-50">
            <MessageCircle className="h-12 w-12 text-zinc-200 mb-4" strokeWidth={1.5} />
            <p className="font-bold text-base text-zinc-500">Select a conversation</p>
            <p className="text-xs text-zinc-400 mt-1">New customer chats appear in the list instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
