import { useState } from "react";
import { FaWhatsapp, FaTimes, FaHeadset } from "react-icons/fa";

// Support WhatsApp number in international format, digits only (no "+", spaces
// or dashes). Configurable via VITE_SUPPORT_WHATSAPP; falls back to the Anza
// support line below.
const SUPPORT_WHATSAPP_NUMBER =
  import.meta.env.VITE_SUPPORT_WHATSAPP || "255743907122";

const DEFAULT_MESSAGE = "Hello Anza Support, I need help with ";

const WhatsAppSupport = ({ leading = null }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const startChat = () => {
    const text = encodeURIComponent(message.trim() || DEFAULT_MESSAGE);
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setMessage("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15">
              <FaHeadset className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Anza Support</p>
              <p className="text-[11px] text-white/80">
                Typically replies within minutes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3 bg-[#ece5dd] p-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm leading-5 text-slate-700 shadow-sm">
              👋 Hi there! How can we help you today? Send us a message and our
              team will assist you right here on WhatsApp.
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  startChat();
                }
              }}
              rows={3}
              placeholder="Type your message..."
              className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#25D366]"
            />

            <button
              type="button"
              onClick={startChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1ebe5b]"
            >
              <FaWhatsapp className="h-5 w-5" />
              Start Chat
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <div className="flex items-center gap-3">
        {leading}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="WhatsApp support"
          className="group flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-3 text-white shadow-lg shadow-[#25D366]/40 transition hover:bg-[#1ebe5b] sm:pr-5"
        >
          {open ? (
            <FaTimes className="h-6 w-6" />
          ) : (
            <FaWhatsapp className="h-6 w-6" />
          )}
          {!open && (
            <span className="hidden text-sm font-bold sm:inline">
              Chat with us
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppSupport;