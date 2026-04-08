"use client";

import { useState, useEffect } from "react";
import { ChatSidebar, type ChatItem } from "./chat-sidebar";
import { ChatHeader, type ChatHeaderData } from "./chat-header";
import { MessageList, type Message } from "./message-list";
import { MessageComposer } from "./message-composer";
import { ChatDetailsPanel, type ChatDetailsData } from "./chat-details-panel";
import { X } from "lucide-react";

export type ChatLayoutProps = {
  chats: ChatItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
  currentChatHeader?: ChatHeaderData;
  messages: Message[];
  onSendMessage: (message: string) => void;
  canChat?: boolean;
  chatDetailsData?: ChatDetailsData;
};

export function ChatLayout({
  chats,
  selectedChatId,
  onSelectChat,
  currentUserId,
  currentChatHeader,
  messages,
  onSendMessage,
  canChat = true,
  chatDetailsData,
}: ChatLayoutProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Handle screen size changes for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1024;
      setIsSmallScreen(isSmall);
      if (!isSmall) {
        setSidebarOpen(false); // Close sidebar on larger screens
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    if (isSmallScreen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden bg-slate-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isSmallScreen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`flex-shrink-0 w-80 overflow-hidden transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-full z-30 lg:static lg:w-80`}
      >
        <div className="flex items-center justify-between lg:hidden border-b border-white/8 p-4">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <button
            className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <ChatSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          currentUserId={currentUserId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentChatHeader ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-white/8 px-4 py-3 lg:px-6 lg:py-4">
              <button
                className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <ChatHeader
                  data={currentChatHeader}
                  onToggleDetails={() => setDetailsOpen(!detailsOpen)}
                  detailsOpen={detailsOpen}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-950/80">
              <MessageList messages={messages} currentUserId={currentUserId} />
            </div>

            {/* Composer */}
            {canChat ? (
              <div className="flex-shrink-0">
                <MessageComposer onSubmit={onSendMessage} />
              </div>
            ) : (
              <div className="flex-shrink-0 border-t border-white/8 px-6 py-6">
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <p className="text-sm font-semibold text-white">You don't have access to this chat</p>
                  <p className="text-xs text-slate-500 mt-2">Join the community to send messages</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
              <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-300 text-center">Select a chat to start messaging</p>
            <p className="text-sm text-slate-500 text-center">Choose from your direct messages or communities</p>
            <button
              className="lg:hidden mt-4 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-colors"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              View Chats
            </button>
          </div>
        )}
      </div>

      {/* Details Panel - Hidden on Mobile */}
      {chatDetailsData && !isSmallScreen && detailsOpen && (
        <div className="flex-shrink-0 w-80 h-full flex flex-col min-h-0 transition-all duration-300 ease-in-out">
          <ChatDetailsPanel data={chatDetailsData} onClose={() => setDetailsOpen(false)} isOpen={detailsOpen} />
        </div>
      )}

      {/* Details Panel - Modal on Mobile */}
      {chatDetailsData && isSmallScreen && detailsOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setDetailsOpen(false)}>
          <div
            className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950/95 border-l border-white/8 shadow-xl flex flex-col min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatDetailsPanel data={chatDetailsData} onClose={() => setDetailsOpen(false)} isOpen={detailsOpen} />
          </div>
        </div>
      )}
    </div>
  );
}
