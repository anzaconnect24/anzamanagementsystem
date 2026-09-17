"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
import { getCalendarSummary } from "@/controllers/calendar_controller";

// The calendar in the top bar. One press, and you are on the calendar.
//
// It carries one signal, and the signal has an order of precedence: a red dot
// means somebody has invited you and is waiting on an answer. That is the only
// thing here that needs you to do something, so it outranks the quieter mark
// for "something is on today", which is only telling you.
const CalendarButton = () => {
  const { pathname } = useLocation();
  const [summary, setSummary] = useState({ invites: 0, today: 0 });

  // Re-counted on navigation. Answering an invitation happens on the calendar
  // page, and a dot that was still there after you had dealt with it would be
  // worse than no dot at all.
  useEffect(() => {
    let alive = true;

    getCalendarSummary().then((body) => {
      if (alive && body) setSummary(body);
    });

    return () => {
      alive = false;
    };
  }, [pathname]);

  const waiting = summary.invites > 0;

  const label = waiting
    ? `Calendar — ${summary.invites} ${summary.invites === 1 ? "invitation" : "invitations"} waiting on you`
    : summary.today > 0
      ? `Calendar — ${summary.today} today`
      : "Calendar";

  return (
    <li className="relative">
      <Link
        to="/dashboard/calendar"
        aria-label={label}
        title={label}
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        {/* A dot rather than a number: the calendar is one press away, and a
            badge that counts is a badge people learn to ignore. */}
        {waiting ? (
          <span
            // Announced, because somebody who cannot see the dot is exactly
            // the person who would otherwise never learn of the invitation.
            role="status"
            className="absolute -top-0.5 right-0 z-10 h-2.5 w-2.5 rounded-full border border-white bg-meta-1 dark:border-boxdark"
          >
            <span className="absolute -left-px -top-px -z-10 inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-meta-1 opacity-75" />
          </span>
        ) : summary.today > 0 ? (
          // Nothing to answer, so no ping and no red: just a mark that the day
          // has something in it.
          <span className="absolute -top-0.5 right-0 z-10 h-2 w-2 rounded-full bg-primary" />
        ) : null}

        <FaRegCalendarAlt className="text-lg" />
      </Link>
    </li>
  );
};

export default CalendarButton;
