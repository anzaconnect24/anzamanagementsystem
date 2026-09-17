"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaApple,
  FaChevronDown,
  FaGoogle,
  FaLink,
  FaMicrosoft,
  FaRegCalendarPlus,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getCalendarFeed,
  resetCalendarFeed,
} from "@/controllers/calendar_controller";

// Reading this calendar from the app a person actually lives in.
//
// A subscription, not an export: the URL is fetched on a schedule by Google or
// Outlook, so an event added here turns up there without anybody doing it
// again. That also means the URL carries its own credential, which is why it
// is only fetched when the menu is opened, never rendered as text on the page,
// and can be rolled from right here when it gets out.
const ExternalCalendarMenu = () => {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(false);

  const trigger = useRef(null);
  const panel = useRef(null);

  // Fetched on first open rather than on mount: most visits to this page never
  // touch this menu, and it hands back a secret.
  useEffect(() => {
    if (!open || feed || loading) return;

    setLoading(true);
    getCalendarFeed()
      .then((body) => {
        if (!body) toast.error("Could not build your calendar link");
        setFeed(body);
      })
      .finally(() => setLoading(false));
  }, [open, feed, loading]);

  useEffect(() => {
    const onClick = ({ target }) => {
      if (!panel.current || !trigger.current) return;
      if (
        !open ||
        panel.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setOpen(false);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  });

  useEffect(() => {
    const onKey = ({ keyCode }) => {
      if (open && keyCode === 27) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const copy = async () => {
    if (!feed?.url) return;

    try {
      await navigator.clipboard.writeText(feed.url);
      toast.success("Link copied — paste it into your calendar app");
    } catch {
      // Clipboard access is refused outside a secure context, which is most
      // of local development. Better a prompt to copy by hand than silence.
      window.prompt("Copy this calendar link", feed.url);
    }
  };

  const roll = async () => {
    if (
      !window.confirm(
        "Create a new link? Any calendar already subscribed to the old one will stop updating.",
      )
    )
      return;

    setLoading(true);
    const body = await resetCalendarFeed();
    setLoading(false);

    if (!body) {
      toast.error("Could not create a new link");
      return;
    }

    setFeed(body);
    toast.success("New link created — subscribe again to resume updates");
  };

  const options = feed
    ? [
        {
          key: "google",
          label: "Google Calendar",
          icon: <FaGoogle className="text-[#ea4335]" />,
          href: feed.google,
        },
        {
          key: "outlook",
          label: "Outlook.com",
          icon: <FaMicrosoft className="text-[#0078d4]" />,
          href: feed.outlook,
        },
        {
          key: "office365",
          label: "Microsoft 365",
          icon: <FaMicrosoft className="text-[#0078d4]" />,
          href: feed.office365,
        },
        {
          key: "apple",
          label: "Apple Calendar",
          icon: <FaApple className="text-slate-700" />,
          href: feed.webcal,
        },
      ]
    : [];

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-slate-300"
      >
        <span className="flex items-center gap-3">
          <FaRegCalendarPlus className="text-lg text-[#082d77]" />
          <span className="text-sm font-semibold text-slate-800">
            Add to external calendar
          </span>
        </span>

        <FaChevronDown
          className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          ref={panel}
          className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <p className="border-b border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500">
            Your calendar, kept up to date in the app you already use. Only you
            can see what this link contains — treat it like a password.
          </p>

          {loading && !feed ? (
            <p className="px-4 py-4 text-sm text-slate-500">
              Building your link…
            </p>
          ) : null}

          {options.map((option) => (
            <a
              key={option.key}
              href={option.href}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {option.icon}
              {option.label}
            </a>
          ))}

          {feed ? (
            <>
              <button
                type="button"
                onClick={copy}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FaLink className="text-slate-400" />
                Copy link for any other app
              </button>

              <button
                type="button"
                onClick={roll}
                disabled={loading}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <FaSyncAlt className="text-rose-400" />
                Create a new link
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ExternalCalendarMenu;
