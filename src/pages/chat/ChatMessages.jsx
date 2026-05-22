"use client";

import { UserContext } from "@/layouts/DashboardLayout";
import { useContext, useEffect, useRef, useState } from "react";
import {
  setDoc,
  collection,
  onSnapshot,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import Breadcrumb from "@/component/Breadcrumb";
import { timeAgo } from "@/utils/time_ago";
import { useTranslation } from "@/locales";
import { useParams } from "react-router-dom";
import { FaPaperPlane, FaComments } from "react-icons/fa";

const MessageComponent = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const uuid = useParams().uuid;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(firestore, "messages"),
      where("conversation_uuid", "==", uuid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (qs) => {
      const data = qs.docs.map((item) => item.data());
      setMessages(data);
    });

    return () => unsubscribe();
  }, [uuid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const id = Timestamp.now();

    const data = {
      conversation_uuid: uuid,
      id: id.toDate().toString(),
      message: message.trim(),
      senderImage: userDetails.image,
      senderName: userDetails.name,
      sender_uuid: userDetails.uuid,
      createdAt: id,
    };

    await setDoc(doc(collection(firestore, "messages"), data.id), data);
    setMessage("");
  };

  return (
    <div className="min-h-screen px-6 py-4">
      <Breadcrumb
        pageName={t("chat.chatPage", "Chat page")}
        prevLink=""
        prevPage={t("common.back", "Back")}
      />

      <div className="relative mb-8 min-h-[220px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/business-class-hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-8 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Messaging Center
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t("chat.chatPage", "Chat Page")}
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-white/85 drop-shadow-md">
            Continue your conversation, share updates, and stay connected in one
            clean workspace.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#172033]">
              <FaComments className="text-[#c9672b]" />
              Conversation
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </p>
          </div>
        </div>

        <div className="h-[55vh] space-y-5 overflow-y-auto bg-[#f8f8f6] px-6 py-6">
          {messages.map((item, key) => {
            const isMine = userDetails.uuid === item.sender_uuid;

            return (
              <div
                key={key}
                className={`flex flex-col ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                    isMine
                      ? "rounded-br-md bg-[#c9672b] text-white"
                      : "rounded-bl-md bg-white text-[#172033]"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isMine ? "text-white/80" : "text-[#8a8f98]"
                    }`}
                  >
                    @{item.senderName}
                  </p>

                  <p className="text-sm leading-6">{item.message}</p>
                </div>

                <span className="mt-1 text-xs text-[#8a8f98]">
                  {item.createdAt?.toDate
                    ? timeAgo(item.createdAt.toDate())
                    : ""}
                </span>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-t border-black/10 bg-white px-5 py-4"
        >
          <input
            type="text"
            placeholder={t("chat.enterMessage", "Enter text here...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-[#f8f8f6] px-4 py-4 text-sm text-[#172033] outline-none transition focus:border-[#c9672b] focus:ring-1 focus:ring-[#c9672b]"
          />

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#c9672b] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85a22] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!message.trim()}
          >
            <FaPaperPlane />
            {t("chat.send", "Send")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageComponent;