import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TimetableStudioPanel } from "./TimetableStudioPanel.jsx";
import { UtilitiesMenusAndModals } from "./UtilitiesMenusAndModals.jsx";
import { cn } from "./utils/cn.js";
import { LinkifiedText, textContainsHttpUrl } from "./utils/LinkifiedText.jsx";

/** Timetable card: class/subject line (Mon P1 demo slot). */
const DEFAULT_LESSON_TITLE_PLACEHOLDER = "Type or Click + to add lesson";
/** Shown in every lesson cell class/subject field when empty. */
const DEFAULT_CLASS_SUBJECT_PLACEHOLDER = "Add class";
/** Shown when room is empty (timetable cell + room editor). */
const DEFAULT_ROOM_PLACEHOLDER = "Room";
const DEFAULT_LESSON_FOCUS_PLACEHOLDER = "Eg: Structure of a Fable";
const DEFAULT_LINE_NOTE_PLACEHOLDER = "Type or Click + to add note";
/** Timetable card: main note textarea under the line note. */
const DEFAULT_SLOT_NOTE_PLACEHOLDER = "Type or Click + to add note";

function isMondayP1Lesson(dayName, period) {
  return dayName === "Monday" && String(period ?? "").trim().toUpperCase() === "P1";
}

// Mocking Framer Motion behavior as provided in the snippet
const AnimatePresence = ({ children }) => <>{children}</>;

const motionComponentCache = new Map();
const motion = new Proxy(
  {},
  {
    get(_, tag) {
      if (!motionComponentCache.has(tag)) {
        motionComponentCache.set(
          tag,
          React.forwardRef(function MotionTag({ children, ...props }, ref) {
            return React.createElement(tag, { ref, ...props }, children);
          })
        );
      }
      return motionComponentCache.get(tag);
    },
  }
);

// --- Icons ---

function IconBase({ children, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Bell = ({ className }) => (
  <IconBase className={className}>
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M9 17a3 3 0 0 0 6 0" />
  </IconBase>
);

const CalendarDays = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </IconBase>
);

const ChevronDown = ({ className }) => (
  <IconBase className={className}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);

const ChevronLeft = ({ className }) => (
  <IconBase className={className}>
    <path d="m15 18-6-6 6-6" />
  </IconBase>
);

const ChevronRight = ({ className }) => (
  <IconBase className={className}>
    <path d="m9 18 6-6-6-6" />
  </IconBase>
);

const ChevronsUpDown = ({ className }) => (
  <IconBase className={className}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </IconBase>
);

const Clock3 = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);

const Focus = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 9V5a2 2 0 0 1 2-2h4" />
    <path d="M15 3h4a2 2 0 0 1 2 2v4" />
    <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
    <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
  </IconBase>
);

const Home = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </IconBase>
);

const LayoutGrid = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconBase>
);

const ListTodo = ({ className }) => (
  <IconBase className={className}>
    <path d="M9 6h12M9 12h12M9 18h12" />
    <path d="m3.5 6 .5.5 1-1M3.5 12 .5.5 1-1M3.5 18 .5.5 1-1" />
  </IconBase>
);

const PanelLeft = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </IconBase>
);

const Plus = ({ className }) => (
  <IconBase className={className}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);

/** Rounded page with dog-ear — outline only; colour via className (e.g. text-slate-400 / text-emerald-600). */
const FilePageOutline = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.05}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
  </svg>
);

const Search = ({ className }) => (
  <IconBase className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconBase>
);

const StickyNote = ({ className }) => (
  <IconBase className={className}>
    <path d="M5 3h14a2 2 0 0 1 2 2v10l-6 6H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M15 21v-6h6" />
  </IconBase>
);

const X = ({ className }) => (
  <IconBase className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </IconBase>
);

const Check = ({ className }) => (
  <IconBase className={className}>
    <path d="M20 6 9 17l-5-5" />
  </IconBase>
);

const Wrench = ({ className }) => (
  <IconBase className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.71 6.7a2.83 2.83 0 1 1-4-4l6.71-6.71a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </IconBase>
);

const ArchiveBox = ({ className }) => (
  <IconBase className={className}>
    <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <path d="M3 4h18v4H3z" />
    <path d="M10 12h4" />
  </IconBase>
);

// --- Initial Data ---

const initialEvents = [
  {
    id: 1,
    title: "Mark persuasive speeches (the fun part)",
    className: "Year 7 English",
    time: "Today · 3:30 pm",
    dueDate: "today",
  },
  {
    id: 2,
    title: "Reply to emails flagged “urgent” from Tuesday",
    className: "Admin",
    time: "Thu · 1:15 pm",
    dueDate: "thisWeek",
  },
  {
    id: 3,
    title: "Photocopy lab sheets — if the machine cooperates",
    className: "Year 9 Science",
    time: "Fri · 8:00 am",
    dueDate: "thisWeek",
  },
  {
    id: 4,
    title: "Brace for group presentations",
    className: "Year 8 Maths",
    time: "Next week",
    dueDate: "later",
  },
];

const sidebarItems = [
  { icon: Home, label: "Home" },
  { icon: LayoutGrid, label: "Dashboard" },
  { icon: ListTodo, label: "Tasks" },
  { icon: CalendarDays, label: "Calendar" },
];

const STUDENT_NOTE_QUICK_CHOICES = [
  "Behaviour issue",
  "Distracting others",
  "Homework incomplete",
  "Uniform issue",
  "Off task",
];

const TERM_WEEKS = Array.from({ length: 11 }, (_, i) => `Week ${i + 1}`);

function weekIndexFromLabel(weekLabel) {
  const n = Number(String(weekLabel ?? "").match(/\d+/)?.[0]);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(TERM_WEEKS.length - 1, Math.floor(n) - 1));
}

function weekLabelForDate(week1StartIso) {
  const week1 = parseIsoToLocalDate(week1StartIso) ?? mondayOfLocalWeek(new Date());
  const today = startOfLocalDay(new Date());
  const delta = Math.floor((today.getTime() - week1.getTime()) / 86400000);
  const weekNumber = Math.max(1, Math.min(TERM_WEEKS.length, Math.floor(delta / 7) + 1));
  return `Week ${weekNumber}`;
}

function weekDayDateFor(week1StartIso, weekLabel, dayName) {
  const week1 = parseIsoToLocalDate(week1StartIso) ?? mondayOfLocalWeek(new Date());
  const weekOffsetDays = weekIndexFromLabel(weekLabel) * 7;
  const dayOffset = TT_WEEKDAY_ORDER.indexOf(dayName);
  if (dayOffset < 0) return null;
  const out = new Date(week1);
  out.setDate(out.getDate() + weekOffsetDays + dayOffset);
  return out;
}

function cloneTimetable(t) {
  return JSON.parse(JSON.stringify(t));
}

function normalizeTimetableForStorage(timetable) {
  return stripWednesdayLessonsToTemplatePeriods(normalizeTimetableSlotPlanned(timetable));
}

// Shared scaffold only (periods, times, class labels, rooms, duties, accents).
// Slot notes, plans, urgent, etc. live in weekLessonOverlays, not here.
const timetableTemplate = [
  {
    day: "Monday",
    short: "Mon",
    items: [
      { id: "mon-d1", type: "duty", label: "Gate duty (coffee first)", time: "8:00 am" },
      {
        id: "mon-1",
        type: "lesson",
        period: "P1",
        time: "8:30–9:20",
        subject: "Intro to persuasive writing",
        room: "Room 12",
        note: "If you're seeing this, it's your first run — everything here is editable.",
      },
      { id: "mon-d2", type: "duty", label: "", time: "9:20 am" },
      {
        id: "mon-2",
        type: "lesson",
        period: "P2",
        time: "9:25–10:15",
        subject: "Year 7 English",
        room: "D Block",
        note: "Half the class forgot books",
      },
      {
        id: "mon-3",
        type: "lesson",
        period: "P3",
        time: "10:40–11:30",
        subject: "Fractions (deep breaths required)",
        room: "Room 12",
        note: "Chase up missing homework",
      },
      { id: "mon-d3", type: "duty", label: "Yard — wish me luck", time: "1:15 pm" },
      {
        id: "mon-4",
        type: "lesson",
        period: "P4",
        time: "11:35–12:25",
        subject: "Year 9 Science",
        room: "Lab 3",
        note: "Lab safety (seriously this time)",
      },
      { id: "mon-d4", type: "duty", label: "", time: "3:00 pm" },
    ],
  },
  {
    day: "Tuesday",
    short: "Tue",
    items: [
      { id: "tue-d1", type: "duty", label: "", time: "8:00 am" },
      {
        id: "tue-1",
        type: "lesson",
        period: "P1",
        time: "8:30–9:20",
        subject: "Year 8 Maths",
        room: "Room 12",
        note: "Photocopier down again",
      },
      { id: "tue-d2", type: "duty", label: "Oval patrol", time: "9:20 am" },
      {
        id: "tue-2",
        type: "lesson",
        period: "P2",
        time: "9:25–10:15",
        subject: "Planning",
        room: "Wherever there's a spare desk",
        note: "Hide until reports are done",
      },
      {
        id: "tue-3",
        type: "lesson",
        period: "P3",
        time: "10:40–11:30",
        subject: "Group work (brace yourself)",
        room: "D Block",
      },
      { id: "tue-d3", type: "duty", label: "", time: "1:15 pm" },
      {
        id: "tue-4",
        type: "lesson",
        period: "P4",
        time: "11:35–12:25",
        subject: "Year 10 Behaviour Recovery (again)",
        room: "Room 12",
      },
      { id: "tue-d4", type: "duty", label: "", time: "3:00 pm" },
    ],
  },
  {
    day: "Wednesday",
    short: "Wed",
    items: [
      { id: "wed-d1", type: "duty", label: "", time: "8:00 am" },
      {
        id: "wed-1",
        type: "lesson",
        period: "P1",
        time: "8:30–9:20",
        subject: "Assembly",
        room: "Hall",
        note: "Assembly period 3 — double-check bell times",
      },
      { id: "wed-d2", type: "duty", label: "", time: "9:20 am" },
      {
        id: "wed-2",
        type: "lesson",
        period: "P2",
        time: "9:25–10:15",
        subject: "Year 9 Science",
        room: "Lab 3",
      },
      {
        id: "wed-3",
        type: "lesson",
        period: "P3",
        time: "10:40–11:30",
        subject: "Year 7 English",
        room: "D Block",
      },
      { id: "wed-d3", type: "duty", label: "Canteen vicinity", time: "1:15 pm" },
      {
        id: "wed-4",
        type: "lesson",
        period: "P4",
        time: "11:35–12:25",
        subject: "Staff meeting (pretend enthusiasm)",
        room: "Staffroom",
      },
      { id: "wed-d4", type: "duty", label: "", time: "3:00 pm" },
    ],
  },
  {
    day: "Thursday",
    short: "Thu",
    items: [
      { id: "thu-d1", type: "duty", label: "", time: "8:00 am" },
      {
        id: "thu-1",
        type: "lesson",
        period: "P1",
        time: "8:30–9:20",
        subject: "Intro to persuasive writing",
        room: "Room 12",
      },
      { id: "thu-d2", type: "duty", label: "Bus bay", time: "10:00 am" },
      {
        id: "thu-2",
        type: "lesson",
        period: "P2",
        time: "9:25–10:15",
        subject: "Planning",
        room: "Office",
        note: "Bring chocolate for morale",
      },
      {
        id: "thu-3",
        type: "lesson",
        period: "P3",
        time: "10:40–11:30",
        subject: "Year 8 Maths",
        room: "Wherever there's a spare desk",
      },
      { id: "thu-d3", type: "duty", label: "", time: "1:15 pm" },
      {
        id: "thu-4",
        type: "lesson",
        period: "P4",
        time: "11:35–12:25",
        subject: "Year 9 Science",
        room: "Lab 3",
      },
      { id: "thu-d4", type: "duty", label: "", time: "3:00 pm" },
    ],
  },
  {
    day: "Friday",
    short: "Fri",
    items: [
      { id: "fri-d1", type: "duty", label: "Friday vibes only", time: "8:00 am" },
      {
        id: "fri-1",
        type: "lesson",
        period: "P1",
        time: "8:30–9:20",
        subject: "Year 10 Behaviour Recovery (again)",
        room: "D Block",
      },
      { id: "fri-d2", type: "duty", label: "", time: "9:20 am" },
      {
        id: "fri-2",
        type: "lesson",
        period: "P2",
        time: "9:25–10:15",
        subject: "Group work (brace yourself)",
        room: "Room 12",
      },
      {
        id: "fri-3",
        type: "lesson",
        period: "P3",
        time: "10:40–11:30",
        subject: "Fractions (deep breaths required)",
        room: "Room 12",
      },
      { id: "fri-d3", type: "duty", label: "", time: "1:15 pm" },
      {
        id: "fri-4",
        type: "lesson",
        period: "P4",
        time: "11:35–12:25",
        subject: "Year 7 English",
        room: "Lab 3",
        note: "Pack up early at your own risk",
      },
      { id: "fri-d4", type: "duty", label: "", time: "3:00 pm" },
    ],
  },
];

const TT_WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// --- Helpers ---

/** Same corner slot as Unit planner / View units panels (inside `main`). */
const studioFloatingAnchorClass =
  "absolute left-1/2 top-6 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0";

function normalizeToolShortcuts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s.label === "string" && typeof s.href === "string")
    .slice(0, 24)
    .map((s, i) => ({
      id: typeof s.id === "string" && s.id ? s.id : `s-${i}-${s.label.slice(0, 8)}`,
      label: s.label.trim().slice(0, 48),
      href: s.href.trim().slice(0, 800),
    }));
}

function normalizeDayCountdownTarget(raw) {
  if (typeof raw !== "string") return "2026-12-20";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "2026-12-20";
}

function normalizeDayCountdownEventLabel(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "Christmas";
  return raw.trim().slice(0, 80);
}

function normalizeCelebrations(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c.name === "string" && typeof c.date === "string")
    .slice(0, 48)
    .map((c, i) => ({
      id: typeof c.id === "string" && c.id ? c.id : `cel-${i}-${Date.now()}`,
      name: c.name.trim().slice(0, 120),
      date: /^\d{4}-\d{2}-\d{2}$/.test(c.date) ? c.date : "",
      yearly: typeof c.yearly === "boolean" ? c.yearly : true,
    }))
    .filter((c) => c.date);
}

function defaultBellReminderSettings() {
  return {
    enabled: false,
    soundEnabled: false,
    periodEndTimes: [],
    dutyTimes: [],
  };
}

function normalizeBellReminderSettings(raw) {
  const def = defaultBellReminderSettings();
  if (!raw || typeof raw !== "object") return def;
  const cleanTimes = (arr) => {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const t of arr) {
      if (typeof t !== "string") continue;
      const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!m) continue;
      const h = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      if (!Number.isFinite(h) || !Number.isFinite(mm) || mm < 0 || mm > 59 || h < 0 || h > 23) continue;
      out.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
      if (out.length >= 24) break;
    }
    return out;
  };
  const daySet = new Set(TT_WEEKDAY_ORDER);
  const cleanDutySlots = (arr) => {
    if (!Array.isArray(arr)) return [];
    const parseHm = (t) => {
      if (typeof t !== "string") return null;
      const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      const h = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      if (!Number.isFinite(h) || !Number.isFinite(mm) || mm < 0 || mm > 59 || h < 0 || h > 23) return null;
      return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };
    const out = [];
    for (const item of arr) {
      if (typeof item === "string") {
        const tm = parseHm(item);
        if (tm) out.push({ day: "Monday", time: tm });
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const dayRaw = typeof item.day === "string" ? item.day : "Monday";
      const day = daySet.has(dayRaw) ? dayRaw : "Monday";
      const tm = parseHm(typeof item.time === "string" ? item.time : "");
      if (!tm) continue;
      out.push({ day, time: tm });
      if (out.length >= 24) break;
    }
    return out;
  };
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : def.enabled,
    soundEnabled: typeof raw.soundEnabled === "boolean" ? raw.soundEnabled : def.soundEnabled,
    periodEndTimes: cleanTimes(raw.periodEndTimes),
    dutyTimes: cleanDutySlots(raw.dutyTimes),
  };
}

function bellReminderTodayWeekdayName() {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}

/** Parse "HH:MM" (24h) to ms since epoch for local today at that clock time. */
function localTodayAtTimeHm(hm) {
  const m = String(hm).match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  d.setMilliseconds(0);
  return d.getTime();
}

function playBellReminderChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 740;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}

/** Next calendar occurrence for Upcoming sort/display: yearly uses month/day anchored to today; one-off uses stored Y-M-D. */
function getCelebrationOccurrence(isoDate, yearly) {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return null;
  const refY = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = Number(parts[2]);
  if (![refY, mo, d].every(Number.isFinite)) return null;
  const monthIndex = mo - 1;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (yearly) {
    let y = now.getFullYear();
    let candMs = new Date(y, monthIndex, d).getTime();
    if (candMs < startToday) {
      y += 1;
      candMs = new Date(y, monthIndex, d).getTime();
    }
    return {
      year: y,
      month: monthIndex,
      date: d,
      sortValue: candMs,
    };
  }

  const candMs = new Date(refY, monthIndex, d).getTime();
  return {
    year: refY,
    month: monthIndex,
    date: d,
    sortValue: candMs,
  };
}

function todayIsoDate() {
  return isoDateFromLocalDate(new Date());
}

const CELEBRATION_LIST_TONE = {
  card: "border-l-4 border-purple-500 bg-purple-950/80",
  chip: "bg-purple-500/40 text-purple-100 border-purple-400/55",
  text: "text-purple-200",
};

function parseShortcutHref(input) {
  const t = input.trim();
  if (!t) return "";
  if (/^mailto:/i.test(t)) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes("@") && !/\s/.test(t)) return `mailto:${t}`;
  return `https://${t.replace(/^\/+/, "")}`;
}

function daysBetweenTodayAndIso(isoDate) {
  const end = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b - a) / 86400000);
}

function hasImportantNote(lesson) {
  return Boolean(lesson.urgent && lesson.note && lesson.note.trim().length > 0);
}

const ADD_LESSON_SEQUENCE_DEFAULTS = ["Warm-up", "Teach", "Practice", "Finish"];

function periodsForDayLessons(timetable, dayName) {
  const day = timetable?.find((d) => d.day === dayName);
  if (!day) return [];
  return day.items.filter((i) => i.type === "lesson").map((i) => i.period);
}

function lessonSlotByDayPeriod(timetable, dayName, period) {
  const day = timetable?.find((d) => d.day === dayName);
  return day?.items.find((i) => i.type === "lesson" && i.period === period) ?? null;
}

function defaultAddLessonDraft(dayName, timetable) {
  const periods = periodsForDayLessons(timetable, dayName);
  const period = periods[0] || "P1";
  const slot = lessonSlotByDayPeriod(timetable, dayName, period);
  return {
    day: dayName,
    period,
    durationMins: 70,
    room: (slot?.room ?? "").trim() || "",
    unitTitle: String(slot?.lessonPlan?.unitTitle ?? ""),
    learningIntention: "",
    successCriteria: [""],
    sequence: ADD_LESSON_SEQUENCE_DEFAULTS.map((phase) => ({ phase, text: "" })),
    resources: "",
    homework: "",
    teacherNote: "",
    lessonTopic: "",
  };
}

/** Green L badge only after “Plan a lesson” has been saved on this slot. */
function lessonSlotHasPlan(lesson) {
  return Boolean(lesson && lesson.type === "lesson" && lesson.slotPlanned === true);
}

/**
 * Remove trailing duplicate of lesson focus from a class/subject string (legacy: topic was saved in `subject`).
 * Supports multi-word topics (e.g. "Unit 2 Fables").
 */
function stripTrailingLessonTopicFromLabel(label, lessonTopic) {
  let s = String(label ?? "").trim();
  const t = String(lessonTopic ?? "").trim();
  if (!s || !t) return s;
  const parts = t.split(/\s+/).filter(Boolean).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!parts.length) return s;
  const re = new RegExp(`\\s+${parts.join("\\s+")}$`, "i");
  return s.replace(re, "").trim();
}

/** Timetable cell title: class + subject (e.g. “7E English”), not the lesson unit (“Fables”). */
function lessonSlotDisplayTitle(lesson) {
  const topic = (lesson?.lessonPlan?.lessonTopic ?? "").trim();
  let s = stripTrailingLessonTopicFromLabel((lesson?.subject ?? "").trim(), topic);
  const c = (lesson?.classGroup ?? "").trim();
  let title = c && s ? `${c} ${s}`.replace(/\s+/g, " ").trim() : s || c || "";
  title = stripTrailingLessonTopicFromLabel(title, topic);
  return title || "—";
}

function lessonHeaderTitleForEdit(lesson) {
  const t = lessonSlotDisplayTitle(lesson);
  return t === "—" ? "" : t;
}

/** Learning plan fields already shown as structured blocks — avoid duplicating them in `note`. */
function hasStructuredLessonPlanPublicContent(lp) {
  if (!lp || typeof lp !== "object") return false;
  if (String(lp.lessonTopic || "").trim()) return true;
  if (String(lp.learningIntention || "").trim()) return true;
  if (Array.isArray(lp.successCriteria) && lp.successCriteria.some((t) => String(t || "").trim())) return true;
  if (Array.isArray(lp.sequence) && lp.sequence.some((s) => String(s?.text || "").trim())) return true;
  if (String(lp.resources || "").trim()) return true;
  if (String(lp.homework || "").trim()) return true;
  return false;
}

/** Sequence, resources, homework, or private note — content after LI/SC on the card. */
function lessonPlanHasExpandableTail(lp) {
  if (!lp || typeof lp !== "object") return false;
  const seq = Array.isArray(lp.sequence) ? lp.sequence : [];
  if (seq.some((s) => String(s?.text || "").trim())) return true;
  if (String(lp.resources || "").trim()) return true;
  if (String(lp.homework || "").trim()) return true;
  if (String(lp.teacherNote || "").trim()) return true;
  return false;
}

/** Initial editor state for `SlotLessonDetailOverlay` from a timetable lesson. */
function lessonPlanEditorsFromLesson(lesson) {
  const p = lesson?.lessonPlan;
  const dm = Number(p?.durationMins);
  const durationMins = Number.isFinite(dm) && dm > 0 ? Math.min(320, Math.round(dm)) : 70;
  if (!p) {
    return {
      durationMins: 70,
      unitTitle: "",
      lessonTopic: "",
      learningIntention: "",
      successCriteria: [""],
      sequence: ADD_LESSON_SEQUENCE_DEFAULTS.map((phase) => ({ phase, text: "" })),
      resources: "",
      homework: "",
      teacherNote: "",
    };
  }
  return {
    durationMins,
    unitTitle: String(p.unitTitle ?? ""),
    lessonTopic: String(p.lessonTopic ?? ""),
    learningIntention: String(p.learningIntention ?? ""),
    successCriteria:
      Array.isArray(p.successCriteria) && p.successCriteria.length
        ? p.successCriteria.map((t) => String(t ?? ""))
        : [""],
    sequence:
      Array.isArray(p.sequence) && p.sequence.length
        ? p.sequence.map((s) => ({
            phase: String(s?.phase ?? "").trim() || "Step",
            text: String(s?.text ?? ""),
          }))
        : ADD_LESSON_SEQUENCE_DEFAULTS.map((phase) => ({ phase, text: "" })),
    resources: String(p.resources ?? ""),
    homework: String(p.homework ?? ""),
    teacherNote: String(p.teacherNote ?? ""),
  };
}

/** Merge onto an existing timetable slot: keep subject, room, time, classGroup from the cell unless room is edited. */
function buildSlotLessonPlanPayload(draft) {
  const n = Number(draft.durationMins);
  const durationMins = Number.isFinite(n) && n > 0 ? Math.min(320, Math.round(n)) : 70;
  const sc = Array.isArray(draft.successCriteria) ? draft.successCriteria : [""];
  const seq = Array.isArray(draft.sequence) ? draft.sequence : [];
  const lessonPlan = {
    durationMins,
    unitTitle: String(draft.unitTitle ?? "").trim(),
    lessonTopic: String(draft.lessonTopic ?? "").trim(),
    learningIntention: draft.learningIntention.trim(),
    successCriteria: sc.map((s) => String(s).trim()).filter(Boolean),
    sequence: seq
      .map((s) => ({
        phase: String(s.phase || "").trim() || "Step",
        text: String(s.text || "").trim(),
      }))
      .filter((s) => s.text),
    resources: draft.resources.trim(),
    homework: draft.homework.trim(),
    teacherNote: draft.teacherNote.trim(),
  };
  const payload = {
    lessonPlan,
    slotPlanned: true,
    note: "",
  };
  if (draft.room.trim()) payload.room = draft.room.trim();
  return payload;
}

function addLessonFieldClass() {
  return "w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300/40";
}

const unitPlannerLab =
  "mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400";
const unitPlannerLabInline =
  "block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400";

function UnitPlannerPanel({ open, onClose, classOptions, onSave }) {
  const inp = addLessonFieldClass();
  const [classLabel, setClassLabel] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [focuses, setFocuses] = useState([""]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setClassLabel(classOptions[0] ?? "");
    setUnitTitle("");
    setFocuses([""]);
    setError("");
  }, [open, classOptions]);

  if (!open) return null;

  function addFocusRow() {
    setFocuses((rows) => [...rows, ""]);
  }

  function removeFocusRow(i) {
    setFocuses((rows) => (rows.length <= 1 ? [""] : rows.filter((_, j) => j !== i)));
  }

  function setFocusAt(i, v) {
    setFocuses((rows) => rows.map((x, j) => (j === i ? v : x)));
  }

  function handleSave() {
    const trimmedTitle = unitTitle.trim();
    const nonEmpty = focuses.map((f) => f.trim()).filter(Boolean);
    if (!classLabel) {
      setError("Choose a class from your timetable first.");
      return;
    }
    if (!trimmedTitle) {
      setError("Add a unit title.");
      return;
    }
    if (nonEmpty.length === 0) {
      setError("Add at least one lesson focus.");
      return;
    }
    setError("");
    onSave({ classLabel, unitTitle: trimmedTitle, lessonFocuses: nonEmpty });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-900/20"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-6 z-[71] flex max-h-[min(88vh,32rem)] w-[min(100%-1.25rem,22rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] sm:left-auto sm:right-5 sm:translate-x-0"
        role="dialog"
        aria-labelledby="unit-planner-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Planning</p>
              <h3 id="unit-planner-title" className="text-base font-semibold tracking-tight text-slate-900">
                Unit outliner
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Save a unit and lesson focuses for a class. Paste <span className="font-mono text-[10px]">https://</span>{" "}
                links — they open as active links in View units.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <div>
              <label className={unitPlannerLab} htmlFor="unit-planner-class">
                Class
              </label>
              {classOptions.length === 0 ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
                  No classes found yet. Add or label lessons on your timetable first (e.g. 7E English).
                </p>
              ) : (
                <select
                  id="unit-planner-class"
                  value={classLabel}
                  onChange={(e) => setClassLabel(e.target.value)}
                  className={cn(inp, "py-2 text-sm")}
                >
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={unitPlannerLab} htmlFor="unit-planner-title-field">
                Unit title
              </label>
              <input
                id="unit-planner-title-field"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className={inp}
                placeholder="e.g. Persuasive writing"
                maxLength={240}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className={unitPlannerLabInline}>Lesson focus</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addFocusRow();
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                  aria-label="Add lesson focus"
                  title="Add lesson focus"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {focuses.map((row, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={row}
                      onChange={(e) => setFocusAt(i, e.target.value)}
                      className={cn(inp, "min-w-0 flex-1 text-sm")}
                      placeholder={DEFAULT_LESSON_FOCUS_PLACEHOLDER}
                      maxLength={320}
                    />
                    <button
                      type="button"
                      onClick={() => removeFocusRow(i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                      aria-label="Remove this focus"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {error ? <p className="text-[11px] font-medium text-red-600">{error}</p> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={classOptions.length === 0}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save unit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ViewUnitsPanel({ open, onClose, unitStore, classOptions }) {
  const inp = addLessonFieldClass();
  const [classLabel, setClassLabel] = useState("");
  const [unitId, setUnitId] = useState("");

  useEffect(() => {
    if (!open) return;
    setClassLabel("");
    setUnitId("");
  }, [open]);

  if (!open) return null;

  const unitsForClass = classLabel ? unitStore.byClass[classLabel] ?? [] : [];
  const sortedUnits = [...unitsForClass].sort((a, b) => {
    const ta = new Date(a.savedAt).getTime();
    const tb = new Date(b.savedAt).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  const selected = sortedUnits.find((u) => u.id === unitId) ?? null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-900/20"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-6 z-[71] flex max-h-[min(88vh,34rem)] w-[min(100%-1.25rem,22rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] sm:left-auto sm:right-5 sm:translate-x-0"
        role="dialog"
        aria-labelledby="view-units-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Planning</p>
              <h3 id="view-units-title" className="text-base font-semibold tracking-tight text-slate-900">
                View units
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Pick a class, then a saved unit.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {classOptions.length === 0 ? (
              <p className="rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2.5 text-[11px] leading-snug text-slate-600">
                No classes or saved units yet. Use <span className="font-semibold text-slate-800">Unit Outliner</span>{" "}
                after your timetable shows class names (e.g. 7E English).
              </p>
            ) : (
              <>
            <div>
              <label className={unitPlannerLab} htmlFor="view-units-class">
                Class
              </label>
              <select
                id="view-units-class"
                value={classLabel}
                onChange={(e) => {
                  setClassLabel(e.target.value);
                  setUnitId("");
                }}
                className={cn(inp, "py-2 text-sm")}
              >
                <option value="">Select class…</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {classLabel ? (
              <div>
                <label className={unitPlannerLab} htmlFor="view-units-unit">
                  Unit
                </label>
                <select
                  id="view-units-unit"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className={cn(inp, "py-2 text-sm")}
                  disabled={sortedUnits.length === 0}
                >
                  <option value="">{sortedUnits.length ? "Select unit…" : "No units saved yet"}</option>
                  {sortedUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitTitle}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {selected ? (
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lesson focuses</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  <LinkifiedText text={selected.unitTitle} className="text-sm font-semibold text-slate-900" />
                </p>
                <ul className="mt-2 space-y-1.5 border-t border-slate-200/80 pt-2">
                  {selected.lessonFocuses.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[11px] leading-snug text-slate-700"
                    >
                      <span className="shrink-0 font-semibold tabular-nums text-slate-400">{i + 1}.</span>
                      <span>
                        <LinkifiedText text={line} className="text-[11px] leading-snug text-slate-700" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function AddLessonPanel({ draft, setDraft, timetable, unitStore, onClose, onSubmit }) {
  const inp = addLessonFieldClass();
  const lab = "mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400";
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);
  const focusMenuWrapRef = useRef(null);
  const slotRow = timetable
    .find((d) => d.day === draft.day)
    ?.items.find((i) => i.type === "lesson" && i.period === draft.period);
  const slotRowTitle = slotRow ? lessonSlotDisplayTitle(slotRow) : "—";
  const slotSubtitle = slotRow
    ? [
        slotRowTitle !== "—" ? slotRowTitle : "This slot",
        (slotRow.room ?? "").trim(),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const plannerClassLabel = slotRowTitle && slotRowTitle !== "—" ? slotRowTitle : "";
  const unitsForClass = useMemo(() => {
    if (!plannerClassLabel) return [];
    const list = unitStore?.byClass?.[plannerClassLabel];
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const ta = new Date(a.savedAt).getTime();
      const tb = new Date(b.savedAt).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }, [unitStore, plannerClassLabel]);
  const unitTitleOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const u of unitsForClass) {
      const t = String(u?.unitTitle ?? "").trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [unitsForClass]);
  const selectedUnit = useMemo(
    () => unitsForClass.find((u) => String(u?.unitTitle ?? "").trim() === String(draft.unitTitle ?? "").trim()) ?? null,
    [unitsForClass, draft.unitTitle]
  );
  const selectedUnitFocusOptions = useMemo(() => {
    if (!selectedUnit || !Array.isArray(selectedUnit.lessonFocuses)) return [];
    return selectedUnit.lessonFocuses.map((f) => String(f ?? "").trim()).filter(Boolean);
  }, [selectedUnit]);

  useEffect(() => {
    const current = String(draft.unitTitle ?? "").trim();
    if (!current) return;
    if (unitTitleOptions.includes(current)) return;
    setDraft((d) => ({ ...d, unitTitle: "" }));
  }, [draft.unitTitle, unitTitleOptions, setDraft]);

  useEffect(() => {
    if (!focusMenuOpen) return;
    const onPointer = (e) => {
      if (focusMenuWrapRef.current?.contains(e.target)) return;
      setFocusMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [focusMenuOpen]);

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-900/20"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-6 z-[71] flex max-h-[min(92vh,42rem)] w-[min(100%-1.25rem,26rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] sm:left-auto sm:right-5 sm:translate-x-0 md:w-[min(100%-2rem,36rem)]"
        role="dialog"
        aria-labelledby="add-lesson-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">New lesson</p>
              <h3 id="add-lesson-title" className="text-base font-semibold tracking-tight text-slate-900">
                Plan a lesson
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {draft.day}
                {slotSubtitle ? ` · ${slotSubtitle}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={lab}>Day</label>
                <select
                  value={draft.day}
                  onChange={(e) => {
                    const nextDay = e.target.value;
                    const ps = periodsForDayLessons(timetable, nextDay);
                    setDraft((d) => {
                      const nextPeriod = ps.includes(d.period) ? d.period : ps[0] || "P1";
                      const slot = lessonSlotByDayPeriod(timetable, nextDay, nextPeriod);
                      return {
                        ...d,
                        day: nextDay,
                        period: nextPeriod,
                        room: (slot?.room ?? "").trim() || d.room,
                      };
                    });
                  }}
                  className={cn(inp, "py-2")}
                >
                  {timetable.map((d) => (
                    <option key={d.day} value={d.day}>
                      {d.day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lab}>Period</label>
                <select
                  value={draft.period}
                  onChange={(e) => {
                    const period = e.target.value;
                    const slot = lessonSlotByDayPeriod(timetable, draft.day, period);
                    setDraft((d) => ({
                      ...d,
                      period,
                      room: (slot?.room ?? "").trim() || d.room,
                    }));
                  }}
                  className={cn(inp, "py-2")}
                >
                  {periodsForDayLessons(timetable, draft.day).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={lab}>Duration (plan)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={320}
                    step={5}
                    value={draft.durationMins}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMins: e.target.value }))}
                    className={cn(inp, "w-[4.5rem] tabular-nums")}
                    autoFocus
                  />
                  <span className="text-xs text-slate-500">mins</span>
                </div>
              </div>
              <div>
                <label className={lab}>Room</label>
                <input
                  type="text"
                  value={draft.room}
                  onChange={(e) => setDraft((d) => ({ ...d, room: e.target.value }))}
                  className={inp}
                  placeholder="Leave blank to keep this slot’s room"
                />
              </div>
            </div>

            <div>
              <label className={lab}>Unit title</label>
              {unitTitleOptions.length === 0 ? (
                <p className="rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                  No saved units for this class yet.
                </p>
              ) : (
                <select
                  value={draft.unitTitle ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, unitTitle: e.target.value }))}
                  className={inp}
                >
                  <option value="">Select unit title</option>
                  {unitTitleOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={lab}>Lesson focus</label>
              <div ref={focusMenuWrapRef} className="relative">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={draft.lessonTopic ?? ""}
                    onFocus={() => setFocusMenuOpen(true)}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, lessonTopic: e.target.value }));
                      setFocusMenuOpen(true);
                    }}
                    className={cn(inp, "min-w-0 flex-1")}
                    placeholder={DEFAULT_LESSON_FOCUS_PLACEHOLDER}
                  />
                  {selectedUnitFocusOptions.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setFocusMenuOpen((v) => !v)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Show lesson focus options"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", focusMenuOpen && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
                {focusMenuOpen && selectedUnitFocusOptions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {selectedUnitFocusOptions.map((focus) => (
                      <button
                        key={focus}
                        type="button"
                        onClick={() => {
                          setDraft((d) => ({ ...d, lessonTopic: focus }));
                          setFocusMenuOpen(false);
                        }}
                        className="flex w-full rounded-md px-2 py-1.5 text-left text-[12px] text-slate-700 transition hover:bg-slate-50"
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className={lab}>Learning intention</label>
              <textarea
                value={draft.learningIntention}
                onChange={(e) => setDraft((d) => ({ ...d, learningIntention: e.target.value }))}
                rows={2}
                className={cn(inp, "resize-y text-sm leading-snug")}
                placeholder="What will students learn?"
              />
            </div>

            <div>
              <label className={lab}>Success criteria</label>
              <div className="space-y-1.5">
                {(Array.isArray(draft.successCriteria) ? draft.successCriteria : [""]).map((line, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) =>
                        setDraft((d) => {
                          const base = Array.isArray(d.successCriteria) ? d.successCriteria : [""];
                          const next = [...base];
                          next[i] = e.target.value;
                          return { ...d, successCriteria: next };
                        })
                      }
                      className={inp}
                      placeholder={`Criterion ${i + 1}`}
                    />
                    {(Array.isArray(draft.successCriteria) ? draft.successCriteria : [""]).length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => {
                            const base = Array.isArray(d.successCriteria) ? d.successCriteria : [""];
                            return {
                              ...d,
                              successCriteria: base.filter((_, j) => j !== i),
                            };
                          })
                        }
                        className="mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove criterion"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraft((d) => ({
                    ...d,
                    successCriteria: [...(Array.isArray(d.successCriteria) ? d.successCriteria : [""]), ""],
                  }));
                }}
                className="mt-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                + Add criterion
              </button>
            </div>

            <div>
              <label className={lab}>Lesson sequence</label>
              <div className="space-y-2">
                {(() => {
                  const defaultPhaseSet = new Set(ADD_LESSON_SEQUENCE_DEFAULTS);
                  const seqRows = Array.isArray(draft.sequence)
                    ? draft.sequence
                    : ADD_LESSON_SEQUENCE_DEFAULTS.map((phase) => ({ phase, text: "" }));
                  return seqRows.map((row, i) => {
                  const showPhaseInput = !defaultPhaseSet.has(row.phase);
                  return (
                  <div key={i} className="flex gap-2">
                    <div className="w-[5.25rem] shrink-0 pt-1.5">
                      {showPhaseInput ? (
                        <input
                          type="text"
                          value={row.phase}
                          onChange={(e) =>
                            setDraft((d) => {
                              const base = Array.isArray(d.sequence) ? d.sequence : seqRows;
                              const next = base.map((s, j) =>
                                j === i ? { ...s, phase: e.target.value } : s
                              );
                              return { ...d, sequence: next };
                            })
                          }
                          className={cn(inp, "px-2 py-1 text-xs")}
                          placeholder="Phase"
                        />
                      ) : (
                        <span className="text-[11px] font-medium leading-snug text-slate-600">{row.phase}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={row.text}
                      onChange={(e) =>
                        setDraft((d) => {
                          const base = Array.isArray(d.sequence) ? d.sequence : seqRows;
                          const next = base.map((s, j) =>
                            j === i ? { ...s, text: e.target.value } : s
                          );
                          return { ...d, sequence: next };
                        })
                      }
                      className={inp}
                      placeholder="What happens in this part?"
                    />
                    {seqRows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => {
                            const base = Array.isArray(d.sequence) ? d.sequence : seqRows;
                            return {
                              ...d,
                              sequence: base.filter((_, j) => j !== i),
                            };
                          })
                        }
                        className="mt-1 shrink-0 self-start rounded-md px-1.5 py-0.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove step"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                  );
                  });
                })()}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraft((d) => ({
                    ...d,
                    sequence: [...(Array.isArray(d.sequence) ? d.sequence : []), { phase: "", text: "" }],
                  }));
                }}
                className="mt-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                + Add step
              </button>
            </div>

            <div>
              <label className={lab}>Resources</label>
              <textarea
                value={draft.resources}
                onChange={(e) => setDraft((d) => ({ ...d, resources: e.target.value }))}
                rows={2}
                className={cn(inp, "resize-y text-sm leading-snug")}
                placeholder="Slides, handouts, links…"
              />
            </div>

            <div>
              <label className={lab}>Homework / follow-up</label>
              <textarea
                value={draft.homework}
                onChange={(e) => setDraft((d) => ({ ...d, homework: e.target.value }))}
                rows={2}
                className={cn(inp, "resize-y text-sm leading-snug")}
                placeholder="What students do next"
              />
            </div>

            <div className="rounded-xl border border-amber-100/80 bg-amber-50/40 px-3 py-2">
              <label className={cn(lab, "text-amber-800/90")}>Private teacher note</label>
              <textarea
                value={draft.teacherNote}
                onChange={(e) => setDraft((d) => ({ ...d, teacherNote: e.target.value }))}
                rows={2}
                className={cn(
                  inp,
                  "resize-y border-amber-200/60 bg-white/90 text-sm leading-snug focus:border-amber-300 focus:ring-amber-200/40"
                )}
                placeholder="Only you — not shown on the lesson card"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Add to timetable
          </button>
        </div>
      </div>
    </>
  );
}

/** Default / clear — lesson.accent null */
const LESSON_ACCENT_DEFAULT = {
  id: null,
  label: "Default",
  dotClass: "border-0 bg-transparent ring-1 ring-slate-300/55 ring-inset",
  card: "",
  swatchClass: "bg-white/90 ring-2 ring-slate-400/60",
};

/**
 * Eight colour families × pastel (soft cell tint) + bold (stronger, still readable).
 * lesson.accent stores e.g. "sky-p" | "sky-b"
 * `card` utilities must use opacity steps Tailwind’s scanner emits (e.g. /25 /30 /80); odd values like /28 or /78 were missing from CSS so cells stayed unshaded.
 */
const LESSON_ACCENT_FAMILIES = [
  {
    pastel: {
      id: "slate-p",
      label: "Slate pastel",
      dotClass: "border-0 bg-slate-200/45 ring-1 ring-slate-300/50 ring-inset",
      card: "border-slate-200/85 bg-slate-200/20",
      swatchClass: "bg-slate-300 ring-1 ring-slate-400/50",
    },
    bold: {
      id: "slate-b",
      label: "Slate",
      dotClass: "border-0 bg-slate-500/65 ring-1 ring-slate-600/55 ring-inset",
      card: "border-slate-500/80 bg-slate-400/30",
      swatchClass: "bg-slate-600 ring-2 ring-slate-800/45",
    },
  },
  {
    pastel: {
      id: "sky-p",
      label: "Sky pastel",
      dotClass: "border-0 bg-sky-200/50 ring-1 ring-sky-300/55 ring-inset",
      card: "border-sky-200/80 bg-sky-100/25",
      swatchClass: "bg-sky-300 ring-1 ring-sky-400/50",
    },
    bold: {
      id: "sky-b",
      label: "Sky",
      dotClass: "border-0 bg-sky-500/70 ring-1 ring-sky-600/55 ring-inset",
      card: "border-sky-500/80 bg-sky-400/30",
      swatchClass: "bg-sky-600 ring-2 ring-sky-800/45",
    },
  },
  {
    pastel: {
      id: "mint-p",
      label: "Mint pastel",
      dotClass: "border-0 bg-emerald-200/45 ring-1 ring-emerald-300/50 ring-inset",
      card: "border-emerald-200/80 bg-emerald-50/30",
      swatchClass: "bg-emerald-300 ring-1 ring-emerald-500/40",
    },
    bold: {
      id: "mint-b",
      label: "Mint",
      dotClass: "border-0 bg-emerald-500/65 ring-1 ring-emerald-600/55 ring-inset",
      card: "border-emerald-500/80 bg-emerald-400/30",
      swatchClass: "bg-emerald-600 ring-2 ring-emerald-800/45",
    },
  },
  {
    pastel: {
      id: "cyan-p",
      label: "Cyan pastel",
      dotClass: "border-0 bg-cyan-200/45 ring-1 ring-cyan-300/50 ring-inset",
      card: "border-cyan-200/75 bg-cyan-50/30",
      swatchClass: "bg-cyan-300 ring-1 ring-cyan-500/42",
    },
    bold: {
      id: "cyan-b",
      label: "Cyan",
      dotClass: "border-0 bg-cyan-500/65 ring-1 ring-cyan-600/55 ring-inset",
      card: "border-cyan-500/80 bg-cyan-400/30",
      swatchClass: "bg-cyan-600 ring-2 ring-cyan-800/45",
    },
  },
  {
    pastel: {
      id: "blue-p",
      label: "Blue pastel",
      dotClass: "border-0 bg-blue-200/45 ring-1 ring-blue-300/50 ring-inset",
      card: "border-blue-200/80 bg-blue-50/30",
      swatchClass: "bg-blue-300 ring-1 ring-blue-500/42",
    },
    bold: {
      id: "blue-b",
      label: "Blue",
      dotClass: "border-0 bg-blue-500/65 ring-1 ring-blue-600/55 ring-inset",
      card: "border-blue-500/80 bg-blue-400/30",
      swatchClass: "bg-blue-600 ring-2 ring-blue-800/45",
    },
  },
  {
    pastel: {
      id: "indigo-p",
      label: "Indigo pastel",
      dotClass: "border-0 bg-indigo-200/45 ring-1 ring-indigo-300/50 ring-inset",
      card: "border-indigo-200/75 bg-indigo-50/30",
      swatchClass: "bg-indigo-300 ring-1 ring-indigo-500/42",
    },
    bold: {
      id: "indigo-b",
      label: "Indigo",
      dotClass: "border-0 bg-indigo-500/65 ring-1 ring-indigo-600/55 ring-inset",
      card: "border-indigo-500/80 bg-indigo-400/30",
      swatchClass: "bg-indigo-600 ring-2 ring-indigo-800/45",
    },
  },
  {
    pastel: {
      id: "violet-p",
      label: "Violet pastel",
      dotClass: "border-0 bg-violet-200/45 ring-1 ring-violet-300/50 ring-inset",
      card: "border-violet-200/75 bg-violet-50/30",
      swatchClass: "bg-violet-300 ring-1 ring-violet-500/42",
    },
    bold: {
      id: "violet-b",
      label: "Violet",
      dotClass: "border-0 bg-violet-500/65 ring-1 ring-violet-600/55 ring-inset",
      card: "border-violet-500/80 bg-violet-400/30",
      swatchClass: "bg-violet-600 ring-2 ring-violet-800/45",
    },
  },
  {
    pastel: {
      id: "rose-p",
      label: "Rose pastel",
      dotClass: "border-0 bg-rose-200/45 ring-1 ring-rose-300/50 ring-inset",
      card: "border-rose-200/80 bg-rose-50/30",
      swatchClass: "bg-rose-300 ring-1 ring-rose-400/48",
    },
    bold: {
      id: "rose-b",
      label: "Rose",
      dotClass: "border-0 bg-rose-500/65 ring-1 ring-rose-600/55 ring-inset",
      card: "border-rose-500/80 bg-rose-400/30",
      swatchClass: "bg-rose-600 ring-2 ring-rose-800/45",
    },
  },
];

const LESSON_ACCENT_LEGACY_MAP = {
  mist: "slate-p",
  haze: "sky-p",
  dew: "cyan-p",
  peri: "indigo-p",
  lilac: "violet-p",
};

const LESSON_ACCENT_BY_ID = LESSON_ACCENT_FAMILIES.reduce((acc, fam) => {
  acc[fam.pastel.id] = fam.pastel;
  acc[fam.bold.id] = fam.bold;
  return acc;
}, {});

function lessonAccentOption(lesson) {
  const id = lesson?.accent;
  if (id === undefined || id === null) return LESSON_ACCENT_DEFAULT;
  if (LESSON_ACCENT_BY_ID[id]) return LESSON_ACCENT_BY_ID[id];
  const mapped = LESSON_ACCENT_LEGACY_MAP[id];
  if (mapped && LESSON_ACCENT_BY_ID[mapped]) return LESSON_ACCENT_BY_ID[mapped];
  return LESSON_ACCENT_DEFAULT;
}

function lessonSubjectKey(subject) {
  return (subject ?? "").trim().toLowerCase();
}

function countLessonsMatchingSubject(timetable, subject) {
  const key = lessonSubjectKey(subject);
  let n = 0;
  for (const day of timetable) {
    for (const item of day.items) {
      if (item.type === "lesson" && lessonSubjectKey(item.subject) === key) n += 1;
    }
  }
  return n;
}

function collectMatchingLessonIds(timetable, subject) {
  const key = lessonSubjectKey(subject);
  const ids = [];
  for (const day of timetable) {
    for (const item of day.items) {
      if (item.type === "lesson" && lessonSubjectKey(item.subject) === key) ids.push(item.id);
    }
  }
  return ids;
}

function collectAllLessonIds(timetable) {
  const ids = [];
  for (const day of timetable) {
    for (const item of day.items) {
      if (item.type === "lesson") ids.push(item.id);
    }
  }
  return ids;
}

function BulkLessonPickGrid({ timetable, subjectForMatch, selectedIds, onToggle }) {
  const matchKey = lessonSubjectKey(subjectForMatch);
  const { dayMap, maxRows } = useMemo(() => {
    const m = new Map();
    for (const d of TT_WEEKDAY_ORDER) {
      const row = timetable.find((x) => x.day === d);
      m.set(d, (row?.items ?? []).filter((i) => i.type === "lesson"));
    }
    let max = 0;
    for (const d of TT_WEEKDAY_ORDER) {
      max = Math.max(max, (m.get(d) ?? []).length);
    }
    return { dayMap: m, maxRows: max };
  }, [timetable]);

  if (maxRows === 0) {
    return <p className="mt-1 text-[10px] text-slate-500">No lesson rows.</p>;
  }

  return (
    <div className="mt-1">
      <div className="mx-auto flex w-max max-w-full justify-center gap-1.5">
        {TT_WEEKDAY_ORDER.map((d) => {
          const lessons = dayMap.get(d) ?? [];
          return (
            <div key={d} className="flex w-11 flex-col items-center gap-1.5">
              <div className="text-center text-[8px] font-semibold text-slate-500">{d.slice(0, 3)}</div>
              <div className="flex flex-col items-center gap-1.5">
                {Array.from({ length: maxRows }, (_, rowIdx) => {
                  const item = lessons[rowIdx];
                  if (!item) {
                    return (
                      <div
                        key={`${d}-r${rowIdx}`}
                        className="flex size-11 items-center justify-center rounded-md bg-slate-50 text-[9px] text-slate-300"
                        aria-hidden
                      >
                        —
                      </div>
                    );
                  }
                  const selected = selectedIds.has(item.id);
                  const sameClass = lessonSubjectKey(item.subject) === matchKey;
                  const label = String(item.period ?? "").trim() || `R${rowIdx + 1}`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onToggle(item.id)}
                      className={cn(
                        "flex size-11 items-center justify-center rounded-md border text-[12px] font-semibold tabular-nums leading-none transition",
                        selected
                          ? "border-transparent bg-slate-200 text-slate-600"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        !selected && sameClass && "text-slate-500"
                      )}
                      title={`${lessonSlotDisplayTitle(item)} · ${(item.room ?? "").trim() || DEFAULT_ROOM_PLACEHOLDER}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomApplyDialogBody({ prompt, timetable, onClose, onApplySelected, onApplyThisSlotOnly }) {
  const matchingIds = useMemo(() => collectMatchingLessonIds(timetable, prompt.subject), [timetable, prompt.subject]);
  const classLabel = (prompt.subject ?? "").trim() || "this class";

  return (
    <div className="relative w-[min(92vw,16.5rem)] rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-[0_10px_26px_-10px_rgba(15,23,42,0.32)]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-7 text-[12px] font-semibold text-slate-900">{prompt.newRoom.trim() || "—"}</p>
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => onApplySelected(matchingIds)}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-2.5 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
        >
          Add to all “{classLabel}” lessons
        </button>
        <button
          type="button"
          onClick={onApplyThisSlotOnly}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-2.5 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
        >
          Just this lesson
        </button>
      </div>
    </div>
  );
}

function SubjectApplyDialogBody({ prompt, timetable, onClose, onApplySelected }) {
  const allLessonIds = useMemo(() => collectAllLessonIds(timetable), [timetable]);
  const [selected, setSelected] = useState(() => new Set([prompt.lessonId]));

  useEffect(() => {
    setSelected(new Set([prompt.lessonId]));
  }, [prompt.lessonId, prompt.newSubject, prompt.oldSubject]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const nSel = selected.size;

  function confirmApply() {
    if (nSel === 0) return;
    onApplySelected([...selected]);
  }

  return (
    <div className="relative w-[min(94vw,23rem)] rounded-lg border border-slate-200 bg-white px-3 pb-2 pt-2 shadow-[0_10px_26px_-10px_rgba(15,23,42,0.32)]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-7 text-[12px] font-semibold leading-tight text-slate-900">
        {prompt.newSubject.trim() || "—"}
      </p>
      <div className="mt-1 flex justify-end gap-3 text-[9px]">
        <button
          type="button"
          className="font-medium text-sky-700 underline decoration-sky-400/60 hover:text-sky-900"
          onClick={() => setSelected(new Set(allLessonIds))}
        >
          All
        </button>
        <button
          type="button"
          className="font-medium text-slate-600 underline hover:text-slate-900"
          onClick={() => setSelected(new Set())}
        >
          None
        </button>
      </div>
      <BulkLessonPickGrid
        timetable={timetable}
        subjectForMatch={prompt.oldSubject}
        selectedIds={selected}
        onToggle={toggle}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={nSel === 0}
          onClick={confirmApply}
          className="rounded-full p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={nSel > 0 ? `Apply class title to ${nSel} selected slots` : "Select at least one slot"}
          title={nSel > 0 ? `Apply to ${nSel} slot${nSel === 1 ? "" : "s"}` : "Select at least one slot"}
        >
          <Check className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

function findLessonInTimetable(timetable, lessonId) {
  for (const day of timetable) {
    const item = day.items.find((i) => i.id === lessonId && i.type === "lesson");
    if (item) return item;
  }
  return null;
}

function findLessonDayNameInTimetable(timetable, lessonId) {
  for (const day of timetable) {
    if (day.items.some((i) => i.id === lessonId && i.type === "lesson")) return day.day;
  }
  return null;
}

/** Position of a duty in its day’s `items` list (same index = same row across the week). */
function findDutySlotInTimetable(timetable, dutyId) {
  for (const day of timetable) {
    const itemIndex = day.items.findIndex((i) => i.id === dutyId && i.type === "duty");
    if (itemIndex !== -1) return { day: day.day, itemIndex };
  }
  return null;
}

function newTimetableItemId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Inserted lesson row; Wednesday stays within P1–P4 so normalization does not strip it */
function newLessonSlotForDay(dayName, dayItems) {
  const lessons = dayItems.filter((i) => i.type === "lesson");
  const used = new Set(lessons.map((i) => String(i.period ?? "").trim()));
  const pool = dayName === "Wednesday" ? ["P1", "P2", "P3", "P4"] : ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
  let period = pool.find((p) => !used.has(p));
  if (!period) {
    period = dayName === "Wednesday" ? "P4" : `P${lessons.length + 1}`;
  }
  return {
    id: newTimetableItemId("lesson"),
    type: "lesson",
    period,
    time: "—",
    subject: "",
    room: "",
    note: "",
    slotPlanned: false,
  };
}

function newDutySlot() {
  return {
    id: newTimetableItemId("duty"),
    type: "duty",
    label: "",
    time: "",
  };
}

/**
 * Add/remove timetable row(s): minimal dialog — position + lesson|duty + day chips, or remove + day chips.
 * `variant`: "add" | "remove" | null
 */
function ScheduleCellModal({ variant, anchorDayName, onClose, onAdd, onRemove }) {
  const [position, setPosition] = useState("below");
  const [kind, setKind] = useState("lesson");
  const [selectedDays, setSelectedDays] = useState(() => new Set([anchorDayName]));

  useEffect(() => {
    if (!variant) return;
    setPosition("below");
    setKind("lesson");
    setSelectedDays(new Set([anchorDayName]));
  }, [variant, anchorDayName]);

  useEffect(() => {
    if (!variant) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, onClose]);

  function toggleDay(d) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size > 1) next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  }

  if (!variant || typeof document === "undefined") return null;

  const dayShort = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri" };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[102] bg-slate-900/20" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-cell-title"
        className="fixed left-1/2 top-1/2 z-[103] w-[min(18.5rem,calc(100%-20px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <h2 id="schedule-cell-title" className="text-[13px] font-semibold tracking-tight text-slate-900">
            {variant === "add" ? "Add cell" : "Remove cell"}
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {variant === "add" ? (
          <>
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Position</p>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition",
                      position === "above" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setPosition("above")}
                  >
                    Above
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition",
                      position === "below" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setPosition("below")}
                  >
                    Below
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Type</p>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition",
                      kind === "lesson" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setKind("lesson")}
                  >
                    Lesson
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition",
                      kind === "duty" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setKind("duty")}
                  >
                    Duty
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Days</p>
                <div className="flex flex-wrap gap-1">
                  {TT_WEEKDAY_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={cn(
                        "min-w-[2.35rem] rounded-full px-2 py-1 text-[10px] font-semibold transition",
                        selectedDays.has(d)
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {dayShort[d] ?? d}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
                    onClick={() => setSelectedDays(new Set([anchorDayName]))}
                  >
                    This day
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
                    onClick={() => setSelectedDays(new Set(TT_WEEKDAY_ORDER))}
                  >
                    Mon–Fri
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-95"
                onClick={() =>
                  onAdd({
                    position,
                    kind,
                    targetDays: TT_WEEKDAY_ORDER.filter((d) => selectedDays.has(d)),
                  })
                }
              >
                Add
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Remove this row from the selected days (same row position on each day).
            </p>
            <div className="mt-3">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Days</p>
              <div className="flex flex-wrap gap-1">
                {TT_WEEKDAY_ORDER.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "min-w-[2.35rem] rounded-full px-2 py-1 text-[10px] font-semibold transition",
                      selectedDays.has(d)
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {dayShort[d] ?? d}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <button
                  type="button"
                  className="text-[10px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
                  onClick={() => setSelectedDays(new Set([anchorDayName]))}
                >
                  This day
                </button>
                <button
                  type="button"
                  className="text-[10px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
                  onClick={() => setSelectedDays(new Set(TT_WEEKDAY_ORDER))}
                >
                  Mon–Fri
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                onClick={() =>
                  onRemove({
                    targetDays: TT_WEEKDAY_ORDER.filter((d) => selectedDays.has(d)),
                  })
                }
              >
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}

/** Fixed popover above anchor (viewport coords); flips below if not enough room */
function accentPickerFixedStyle(anchor, step) {
  const zIndex = 200;
  if (!anchor) {
    return {
      position: "fixed",
      left: "50%",
      top: "45%",
      transform: "translate(-50%, -50%)",
      zIndex,
    };
  }
  const { left, top, width, height } = anchor;
  const cx = left + width / 2;
  const gap = 6;
  const estH = step === "confirm" ? 100 : 72;
  if (top - gap - estH < 10) {
    return {
      position: "fixed",
      left: cx,
      top: top + height + gap,
      transform: "translateX(-50%)",
      zIndex,
    };
  }
  return {
    position: "fixed",
    left: cx,
    top: top - gap,
    transform: "translate(-50%, -100%)",
    zIndex,
  };
}

/** Shortcuts menu: always opens below anchor so it does not clip off the top of the screen */
function dashboardToolsMenuStyle(anchor, panelWidth = 260) {
  const zIndex = 200;
  if (!anchor) {
    return { position: "fixed", left: "50%", top: "22%", transform: "translateX(-50%)", zIndex };
  }
  const gap = 6;
  const { left, top, width, height } = anchor;
  const topPx = top + height + gap;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  let leftPx = left;
  const maxLeft = vw - panelWidth - 8;
  if (leftPx > maxLeft) leftPx = Math.max(8, maxLeft);
  return {
    position: "fixed",
    left: leftPx,
    top: topPx,
    zIndex,
    width: `min(92vw, ${panelWidth}px)`,
  };
}

/** Calculator panel: to the right of the trigger, top-aligned, grows downward */
function dashboardCalcPanelStyle(anchor, panelWidth = 248) {
  const zIndex = 200;
  if (!anchor) {
    return { position: "fixed", right: 16, top: 120, zIndex, width: panelWidth };
  }
  const gap = 8;
  const { left, top, width, height } = anchor;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let leftPx = left + width + gap;
  if (leftPx + panelWidth > vw - 8) {
    leftPx = left - panelWidth - gap;
    if (leftPx < 8) leftPx = 8;
  }
  const topPx = top;
  const maxH = vh - topPx - 8;
  return {
    position: "fixed",
    left: leftPx,
    top: topPx,
    zIndex,
    width: panelWidth,
    maxHeight: Math.max(200, maxH),
  };
}

function dashboardCelebrationsPanelStyle(anchor, panelWidth = 300) {
  return dashboardCalcPanelStyle(anchor, panelWidth);
}

function dashboardBellReminderPanelStyle(anchor, panelWidth = 584) {
  return dashboardCalcPanelStyle(anchor, panelWidth);
}

function anchoredPopoverTop(anchor, estimatedHeight = 260, margin = 8) {
  if (!anchor) return margin;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const belowTop = anchor.bottom + 6;
  if (belowTop + estimatedHeight <= vh - margin) return Math.max(margin, belowTop);
  return Math.max(margin, anchor.top - estimatedHeight - 6);
}

function startOfLocalDay(input) {
  const d = input instanceof Date ? input : new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function mondayOfLocalWeek(input = new Date()) {
  const d = startOfLocalDay(input);
  const delta = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - delta);
  return d;
}

function schoolWeekMonday(input = new Date()) {
  const d = startOfLocalDay(input);
  // On Sunday, teachers usually mean the coming school week.
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return mondayOfLocalWeek(d);
}

function isoDateFromLocalDate(input = new Date()) {
  const d = startOfLocalDay(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoToLocalDate(iso) {
  if (typeof iso !== "string") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  const out = new Date(y, mo - 1, d);
  if (Number.isNaN(out.getTime())) return null;
  return startOfLocalDay(out);
}

function getReminderStatus(date, month, year) {
  if (![date, month, year].every(Number.isFinite)) return "later";
  const target = startOfLocalDay(new Date(year, month, date));
  if (Number.isNaN(target.getTime())) return "later";
  const today = startOfLocalDay(new Date());
  const deltaDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (deltaDays < 0) return "overdue";
  if (deltaDays === 0) return "today";
  if (deltaDays === 1) return "tomorrow";
  if (deltaDays >= 2 && deltaDays <= 6) return "thisWeek";
  return "later";
}

function getCalendarEventTone(status, kind = "reminder") {
  if (status === "overdue") {
    return {
      card: "border-l-4 border-red-600 bg-black",
      dot: "bg-red-500",
      text: "text-red-200 font-medium",
      label: "Overdue",
      chip: "bg-slate-900 text-slate-100 border-slate-700",
      overdueChip: "bg-red-600 text-red-50 border-red-400",
    };
  }
  if (status === "today") {
    return {
      card: "border-l-4 border-red-500 bg-red-100/70",
      dot: "bg-red-600",
      text: "text-red-600",
      label: "Today",
      chip: "bg-red-200 text-red-700 border-red-300",
      overdueChip: "bg-red-200 text-red-700 border-red-300",
    };
  }

  if (status === "tomorrow") {
    return {
      card: "border-l-4 border-red-500 bg-red-500/90",
      dot: "bg-red-500",
      text: "text-white font-medium",
      label: "Tomorrow",
      chip: "bg-white/40 text-white border-white/50",
      overdueChip: "bg-white/40 text-white border-white/50",
    };
  }

  if (status === "thisWeek") {
    return {
      card: "border-l-4 border-orange-400 bg-orange-400/90",
      dot: "bg-orange-500",
      text: "text-white font-medium",
      label: "This week",
      chip: "bg-white/40 text-white border-white/50",
      overdueChip: "bg-white/40 text-white border-white/50",
    };
  }

  return {
    card: "border border-slate-700 bg-slate-800",
    dot: "bg-slate-400",
    text: "text-slate-400",
    label: "Later",
    chip: "bg-slate-700 text-slate-100 border-slate-600",
    overdueChip: "bg-slate-700 text-slate-100 border-slate-600",
  };
}

/** List row text on light month cells — same colour families as sidebar upcoming chips. */
function upcomingMonthListTextClass(item) {
  if (item?.kind === "celebration") return "font-medium text-purple-700";
  const status = item?.status ?? "later";
  if (status === "overdue") return "font-medium text-red-800";
  if (status === "today" || status === "tomorrow") return "font-medium text-red-700";
  if (status === "thisWeek") return "font-medium text-orange-700";
  return "font-medium text-slate-600";
}

function getDayNameFromDate(date, month = 2, year = 2026) {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[new Date(year, month, date).getDay()];
}

// --- Components ---

function MiniCalendar({ reminders, onSelectDate, calendarMonth, onPrevMonth, onNextMonth }) {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
  const mondayStartOffset = (firstDay + 6) % 7;
  const todayDate = new Date();
  const isCurrentMonth =
    todayDate.getFullYear() === calendarMonth.year &&
    todayDate.getMonth() === calendarMonth.month;
  const today = isCurrentMonth ? todayDate.getDate() : null;
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
  const leadingBlanks = Array.from({ length: mondayStartOffset }, (_, i) => `blank-${i}`);
  const grid = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const reminderDaySet = useMemo(() => {
    const s = new Set();
    for (const r of reminders) {
      if (!r || typeof r !== "object") continue;
      const y = Number(r.year);
      const m = Number(r.month);
      const d = Number(r.date);
      if (!Number.isFinite(d) || d < 1 || d > 31) continue;
      if (y === calendarMonth.year && m === calendarMonth.month) {
        s.add(d);
      }
    }
    return s;
  }, [reminders, calendarMonth.year, calendarMonth.month]);

  return (
    <div className="w-full max-w-[180px] rounded-[5px] border border-white/20 bg-white/10 p-1.5 shadow-lg backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-0.5">
        <div className="flex min-w-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onPrevMonth}
            className="shrink-0 rounded-full p-0.5 text-slate-300 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-2.5 w-2.5" />
          </button>
          <h3 className="min-w-0 truncate text-[11px] font-semibold leading-tight text-slate-100">{monthLabel}</h3>
          <button
            type="button"
            onClick={onNextMonth}
            className="shrink-0 rounded-full p-0.5 text-slate-300 transition hover:bg-white/10"
          >
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-white/25 bg-white/10 p-1 text-slate-200 shadow-sm transition hover:bg-white/15"
        >
          <Bell className="h-2.5 w-2.5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-px text-center text-[8px] font-medium text-slate-400">
        {days.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {leadingBlanks.map((blank) => (
          <div key={blank} className="h-[18px]" />
        ))}

        {grid.map((day) => {
          const isToday = day === today;
          const hasReminder = reminderDaySet.has(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex h-[18px] items-center justify-center rounded-[3px] text-[9px] transition",
                isToday
                  ? "bg-white font-semibold text-slate-900"
                  : "bg-white/15 text-slate-100 hover:bg-white/25"
              )}
              aria-label={
                hasReminder
                  ? `${day} ${monthLabel}, has reminder or event`
                  : `${day} ${monthLabel}`
              }
            >
              <span className="leading-none">{day}</span>
              {hasReminder ? (
                <span
                  className={cn(
                    "absolute bottom-0.5 left-1/2 h-[2.5px] w-[2.5px] -translate-x-1/2 rounded-full bg-red-400",
                    isToday && "bg-red-500"
                  )}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlipClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateLabel = now.toLocaleDateString("en-AU", { month: "short", day: "numeric" });

  return (
    <div className="flex h-full min-w-[13.5rem] items-center justify-center gap-3 rounded-[5px] border border-slate-200 bg-slate-900 px-4 py-1 text-white shadow-sm">
      <span className="text-3xl font-black tabular-nums tracking-tight leading-none">
        {hours}:{minutes}
      </span>
      <span className="text-sm font-semibold leading-tight text-white/90">{dateLabel}</span>
    </div>
  );
}

function MiniCalculator({ onClose }) {
  const [current, setCurrent] = useState("0");
  const [stored, setStored] = useState(null);
  const [op, setOp] = useState(null);

  const applyOp = (a, b, operator) => {
    switch (operator) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const digit = (d) => {
    setCurrent((c) => {
      if (c === "0" && d !== ".") return d;
      if (d === "." && c.includes(".")) return c;
      return c + d;
    });
  };

  const pickOp = (nextOp) => {
    const n = parseFloat(current);
    if (Number.isNaN(n)) return;
    if (stored != null && op) {
      const r = applyOp(stored, n, op);
      setStored(Number.isFinite(r) ? r : 0);
      setCurrent(String(Number.isFinite(r) ? r : 0));
    } else {
      setStored(n);
      setCurrent("0");
    }
    setOp(nextOp);
  };

  const equals = () => {
    const n = parseFloat(current);
    if (stored == null || !op || Number.isNaN(n)) return;
    const r = applyOp(stored, n, op);
    setCurrent(String(Number.isFinite(r) ? r : 0));
    setStored(null);
    setOp(null);
  };

  const clearAll = () => {
    setCurrent("0");
    setStored(null);
    setOp(null);
  };

  const btn =
    "flex min-h-[2.625rem] min-w-[3rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 active:bg-slate-100 sm:min-w-[3.375rem]";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Calculator</span>
        <button type="button" onClick={onClose} className="text-[10px] font-medium text-slate-400 hover:text-slate-600">
          Close
        </button>
      </div>
      <div className="mb-2 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-right text-base font-semibold tabular-nums text-slate-900">
        {current}
        {op ? ` ${op}` : ""}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button type="button" className={btn} onClick={clearAll}>
          C
        </button>
        <button type="button" className={btn} onClick={() => pickOp("÷")}>
          ÷
        </button>
        <button type="button" className={btn} onClick={() => pickOp("×")}>
          ×
        </button>
        <button type="button" className={btn} onClick={() => pickOp("−")}>
          −
        </button>
        {["7", "8", "9", "+"].map((d) =>
          d === "+" ? (
            <button key={d} type="button" className={btn} onClick={() => pickOp("+")}>
              +
            </button>
          ) : (
            <button key={d} type="button" className={btn} onClick={() => digit(d)}>
              {d}
            </button>
          )
        )}
        {["4", "5", "6"].map((d) => (
          <button key={d} type="button" className={btn} onClick={() => digit(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={btn} onClick={equals}>
          =
        </button>
        {["1", "2", "3", "0"].map((d) => (
          <button key={d} type="button" className={btn} onClick={() => digit(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={cn(btn, "col-span-4")} onClick={() => digit(".")}>
          .
        </button>
      </div>
    </div>
  );
}

function LessonSlotRow({
  lesson,
  dayName,
  onOpenSlotDetail,
  onOpenAddLessonForSlot,
  onOpenAccentPicker,
  onOpenStudentNoteEntryForLesson,
  onSlotNoteCommit,
  onLessonHeaderCommitAttempt,
  subjectApplyPrompt,
  onOpenCalendarKind,
  insertCellsAtAnchor,
  removeCellsAtAnchor,
  isFocusDay = false,
  isExpanded,
  onToggleExpand,
  editingField,
  editingValue,
  onStartEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
}) {
  const importantNote = hasImportantNote(lesson);
  const accentOpt = lessonAccentOption(lesson);
  const planned = lessonSlotHasPlan(lesson);
  const roomTrim = (lesson.room ?? "").trim();
  const roomShowPlaceholder = !roomTrim || roomTrim === "—";
  const lp = lesson.lessonPlan;
  const planLearningIntention = (lp?.learningIntention ?? "").trim();
  const planSuccessCriteriaList = Array.isArray(lp?.successCriteria)
    ? lp.successCriteria.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];
  const planSuccessCriteriaText = planSuccessCriteriaList.join(" · ");
  const planLessonTopic = (lp?.lessonTopic ?? "").trim();

  const isLessonEditing = (field) =>
    editingField?.itemId === lesson.id && editingField?.field === field && editingField?.type === "lesson";

  const titleHitClass =
    "min-w-0 truncate rounded-[2px] border border-transparent px-0.5 text-left font-medium outline-none transition hover:border-slate-200/80 hover:bg-slate-50/80";
  const planTail = lessonPlanHasExpandableTail(lp);
  const sequenceItems = Array.isArray(lp?.sequence)
    ? lp.sequence.filter((s) => String(s?.text || "").trim())
    : [];
  const [headerDraft, setHeaderDraft] = useState(() => lessonHeaderTitleForEdit(lesson));
  const [plusMenuAnchor, setPlusMenuAnchor] = useState(null);
  const [cellModal, setCellModal] = useState(null);
  const headerInputRef = useRef(null);
  const roomInputRef = useRef(null);
  const skipNextHeaderBlurCommitRef = useRef(false);
  const prevSubjectApplyRef = useRef(null);
  const prevRoomEditingRef = useRef(false);
  const plusBtnRef = useRef(null);

  const bodyText = cn("break-words leading-snug text-slate-600", "text-[9px]", isFocusDay && "text-[10px]");
  const showExpandChevron = planTail;

  useEffect(() => {
    if (headerInputRef.current === document.activeElement) return;
    setHeaderDraft(lessonHeaderTitleForEdit(lesson));
  }, [lesson.id, lesson.subject, lesson.classGroup, lesson.lessonPlan?.lessonTopic]);

  useEffect(() => {
    const prev = prevSubjectApplyRef.current;
    prevSubjectApplyRef.current = subjectApplyPrompt;
    if (headerInputRef.current === document.activeElement) return;
    if (prev && !subjectApplyPrompt && prev.lessonId === lesson.id) {
      setHeaderDraft(lessonHeaderTitleForEdit(lesson));
    }
  }, [subjectApplyPrompt, lesson.id, lesson.subject, lesson.classGroup, lesson.lessonPlan?.lessonTopic]);

  useLayoutEffect(() => {
    const editingRoom =
      editingField?.itemId === lesson.id && editingField?.field === "room" && editingField?.type === "lesson";
    if (editingRoom && !prevRoomEditingRef.current) {
      const el = roomInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
    prevRoomEditingRef.current = editingRoom;
  }, [editingField?.itemId, editingField?.field, editingField?.type, lesson.id]);

  useEffect(() => {
    if (!plusMenuAnchor) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPlusMenuAnchor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plusMenuAnchor]);

  function calendarDefaultTitle() {
    const a = lessonSlotDisplayTitle(lesson);
    const b = (lesson.room ?? "").trim();
    if (a && a !== "—" && b) return `${a} · ${b}`;
    if (a && a !== "—") return a;
    return b || "";
  }

  function closePlusMenu() {
    setPlusMenuAnchor(null);
  }

  function togglePlusMenu() {
    if (plusMenuAnchor) {
      closePlusMenu();
      return;
    }
    const r = plusBtnRef.current?.getBoundingClientRect();
    if (r) setPlusMenuAnchor({ left: r.left, right: r.right, bottom: r.bottom, top: r.top });
  }

  const panelW = insertCellsAtAnchor && removeCellsAtAnchor ? 200 : 184;
  const plusMenuPortal =
    typeof document !== "undefined" && plusMenuAnchor
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              aria-hidden
              onClick={(e) => {
                e.stopPropagation();
                closePlusMenu();
              }}
            />
            <div
              role="menu"
              aria-label="Lesson actions"
              className="fixed z-[101] max-h-[min(70vh,24rem)] w-[min(14rem,calc(100vw-16px))] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg"
              style={{
                top: anchoredPopoverTop(plusMenuAnchor, 260),
                left: Math.max(
                  8,
                  Math.min(
                    plusMenuAnchor.left,
                    (typeof window !== "undefined" ? window.innerWidth : 400) - 8 - panelW
                  )
                ),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { key: "studentNote", label: "Add Student Note" },
                { key: "lesson", label: "Lesson" },
                { key: "reminder", label: "Reminder", kind: "reminder" },
                { key: "task", label: "Task", kind: "task" },
                { key: "event", label: "Event", kind: "event" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    closePlusMenu();
                    if (opt.key === "studentNote") {
                      onOpenStudentNoteEntryForLesson(lesson, dayName);
                      return;
                    }
                    if (opt.key === "lesson") {
                      if (planned) onOpenSlotDetail(lesson);
                      else onOpenAddLessonForSlot(dayName, lesson.period);
                      return;
                    }
                    if (opt.kind) onOpenCalendarKind(opt.kind, calendarDefaultTitle());
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {insertCellsAtAnchor && removeCellsAtAnchor ? (
                <>
                  <div className="my-1 border-t border-slate-100" role="separator" />
                  <p className="px-3 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Cell
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      closePlusMenu();
                      setCellModal("add");
                    }}
                  >
                    Add cell…
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      closePlusMenu();
                      setCellModal("remove");
                    }}
                  >
                    Remove cell…
                  </button>
                </>
              ) : null}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
    <div
      className={cn(
        "flex min-h-[4.75rem] w-full flex-col rounded-[5px] border px-2 py-1.5 text-left shadow-sm transition",
        importantNote
          ? "border-red-200 bg-red-50/80"
          : accentOpt.card
            ? accentOpt.card
            : "border-slate-200 bg-white/90",
        isFocusDay && "min-h-[5.25rem] px-2.5 py-2"
      )}
    >
      <div className="shrink-0 space-y-0.5">
        <div className="flex w-full items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 max-w-full flex-nowrap items-baseline gap-0">
              <input
                ref={headerInputRef}
                type="text"
                value={headerDraft}
                onChange={(e) => setHeaderDraft(e.target.value)}
                onBlur={() => {
                  if (skipNextHeaderBlurCommitRef.current) {
                    skipNextHeaderBlurCommitRef.current = false;
                    return;
                  }
                  const t = headerDraft.trim();
                  const next = t || "—";
                  const opened = onLessonHeaderCommitAttempt(lesson.id, next);
                  if (!opened) {
                    setHeaderDraft(next === "—" ? "" : next);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const el = headerInputRef.current;
                  if (!el || document.activeElement === el) return;
                  requestAnimationFrame(() => {
                    if (document.activeElement === el) el.select();
                  });
                }}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    const t = headerDraft.trim();
                    const next = t || "—";
                    const opened = onLessonHeaderCommitAttempt(lesson.id, next, { openPicker: true });
                    if (opened) {
                      skipNextHeaderBlurCommitRef.current = true;
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setHeaderDraft(lessonHeaderTitleForEdit(lesson));
                    e.currentTarget.blur();
                  }
                }}
                placeholder={DEFAULT_CLASS_SUBJECT_PLACEHOLDER}
                aria-label="Class and subject"
                title="Class and subject"
                className={cn(
                  "min-w-0 max-w-[calc(100%-4.5rem)] shrink select-text rounded border border-transparent bg-transparent px-0.5 py-0 text-left text-[10px] font-medium text-slate-800 outline-none ring-0 transition placeholder:text-slate-400/70 hover:bg-slate-50/50 focus:border-slate-300/40",
                  isFocusDay && "text-[11px]"
                )}
              />
              {isLessonEditing("room") ? (
                <input
                  ref={roomInputRef}
                  value={editingValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const el = roomInputRef.current;
                    if (!el || document.activeElement === el) return;
                    requestAnimationFrame(() => {
                      if (document.activeElement === el) el.select();
                    });
                  }}
                  onBlur={onEditSave}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onEditSave();
                    if (e.key === "Escape") onEditCancel();
                  }}
                  placeholder={DEFAULT_ROOM_PLACEHOLDER}
                  className={cn(
                    "ml-[2ch] w-[3.5rem] shrink-0 select-text rounded-[3px] border border-slate-300 bg-white px-0.5 text-left text-[10px] text-slate-900 outline-none placeholder:text-slate-400/70 sm:w-16",
                    isFocusDay && "text-[11px]"
                  )}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(lesson.id, "room", roomShowPlaceholder ? "" : lesson.room ?? "", "lesson");
                  }}
                  className={cn(
                    titleHitClass,
                    "ml-[2ch] max-w-[5rem] shrink-0 truncate text-left text-[10px] sm:max-w-[6rem]",
                    roomShowPlaceholder ? "text-slate-400/80" : "text-slate-600",
                    isFocusDay && "text-[11px]"
                  )}
                  title={roomTrim || DEFAULT_ROOM_PLACEHOLDER}
                >
                  {roomShowPlaceholder ? DEFAULT_ROOM_PLACEHOLDER : roomTrim}
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 self-start">
            <button
              type="button"
              data-lesson-accent-hit
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onOpenAccentPicker(lesson.id, {
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                });
              }}
              title={`Lesson colour: ${accentOpt.label}`}
              aria-label={`Choose lesson colour (${accentOpt.label})`}
              className={cn(
                "h-5 min-w-7 shrink-0 cursor-pointer rounded-[4px] border border-transparent transition-colors hover:bg-slate-900/[0.06]",
                isFocusDay && "h-6 min-w-8"
              )}
            />
            {importantNote ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden /> : null}
            <div className="flex shrink-0 items-center gap-px">
              {planned ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSlotDetail(lesson);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-500/90 transition hover:bg-emerald-50/80"
                  aria-label="Open lesson plan"
                  title="Lesson plan"
                >
                  <FilePageOutline className="h-[18px] w-[18px]" />
                </button>
              ) : null}
              {showExpandChevron ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:bg-slate-100/80",
                    !isExpanded && planTail ? "text-emerald-600" : "text-slate-400",
                    isExpanded && "text-slate-500"
                  )}
                  aria-expanded={isExpanded}
                  title={isExpanded ? "Show less" : "Show full lesson"}
                  aria-label={isExpanded ? "Collapse lesson details" : "Expand lesson details"}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </button>
              ) : null}
              <button
                ref={plusBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlusMenu();
                }}
                className={cn(
                  "flex h-6 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-slate-400/90 shadow-none outline-none transition hover:bg-transparent hover:text-slate-600 focus-visible:ring-1 focus-visible:ring-slate-400/50",
                  isFocusDay && "h-6",
                  plusMenuAnchor && "text-slate-700"
                )}
                title="Add note, lesson, or calendar item"
                aria-label="Open lesson actions menu"
                aria-expanded={Boolean(plusMenuAnchor)}
                aria-haspopup="menu"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <textarea
          value={lesson.note ?? ""}
          onChange={(e) => onSlotNoteCommit(lesson.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.stopPropagation()}
          rows={1}
          placeholder={DEFAULT_SLOT_NOTE_PLACEHOLDER}
          aria-label="Lesson note on timetable"
          className={cn(
            "mt-0.5 w-full cursor-text resize-none rounded border border-transparent bg-transparent px-1 py-0.5 text-[9px] leading-snug text-slate-800 outline-none ring-0 transition hover:bg-slate-50/50 placeholder:text-slate-400/60 focus:border-slate-300/40 focus:ring-0",
            isFocusDay && "text-[10px]"
          )}
        />
        {planLessonTopic || planLearningIntention || planSuccessCriteriaText ? (
          <div className="mt-0.5 w-full min-w-0 space-y-0.5 border-t border-slate-100/80 pt-0.5">
            {planLessonTopic ? (
              <p className={cn(bodyText, "w-full")} title={planLessonTopic}>
                <span className="font-semibold text-slate-400">Focus: </span>
                <span className="whitespace-normal break-words">{planLessonTopic}</span>
              </p>
            ) : null}
            {planLearningIntention ? (
              <p className={cn(bodyText, "w-full")} title={planLearningIntention}>
                <span className="font-semibold text-slate-400">Intention: </span>
                <span className="whitespace-normal break-words">{planLearningIntention}</span>
              </p>
            ) : null}
            {planSuccessCriteriaText ? (
              <p className={cn(bodyText, "w-full")} title={planSuccessCriteriaText}>
                <span className="font-semibold text-slate-400">Success: </span>
                <span className="whitespace-normal break-words">{planSuccessCriteriaText}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {isExpanded && planTail ? (
          <div className="w-full min-w-0 space-y-1.5 border-t border-slate-100/80 pt-1.5">
                {sequenceItems.length ? (
                  <div>
                    <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                      Sequence
                    </p>
                    <ul className="space-y-0.5">
                      {sequenceItems.map((s, i) => (
                        <li key={i} className={bodyText}>
                          <span className="font-medium text-slate-700">
                            {String(s.phase || "Step").trim()}
                          </span>
                          {" — "}
                          <LinkifiedText
                            text={String(s.text || "").trim()}
                            className={bodyText}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {String(lp?.resources || "").trim() ? (
                  <p className={bodyText}>
                    <span className="font-semibold text-slate-500">Resources: </span>
                    <LinkifiedText
                      text={String(lp.resources).trim()}
                      className={bodyText}
                    />
                  </p>
                ) : null}
                {String(lp?.homework || "").trim() ? (
                  <p className={bodyText}>
                    <span className="font-semibold text-slate-500">Homework: </span>
                    <LinkifiedText text={String(lp.homework).trim()} className={bodyText} />
                  </p>
                ) : null}
                {String(lp?.teacherNote || "").trim() ? (
                  <div className="rounded-md border border-amber-200/60 bg-amber-50/50 px-1.5 py-1">
                    <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-800/80">
                      Private note
                    </p>
                    <p className={cn(bodyText, "whitespace-pre-wrap text-amber-950/90")}>
                      <LinkifiedText
                        text={String(lp.teacherNote).trim()}
                        className={cn(bodyText, "text-amber-950/90")}
                      />
                    </p>
                  </div>
                ) : null}
          </div>
        ) : null}
      </div>
    </div>
    {plusMenuPortal}
    <ScheduleCellModal
      variant={cellModal}
      anchorDayName={dayName}
      onClose={() => setCellModal(null)}
      onAdd={(payload) => {
        insertCellsAtAnchor({
          anchorDayName: dayName,
          anchorItemId: lesson.id,
          position: payload.position,
          kind: payload.kind,
          targetDays: payload.targetDays,
        });
        setCellModal(null);
      }}
      onRemove={(payload) => {
        removeCellsAtAnchor({
          anchorDayName: dayName,
          anchorItemId: lesson.id,
          targetDays: payload.targetDays,
        });
        setCellModal(null);
      }}
    />
    </>
  );
}

function PlanningLinkPreview({ text }) {
  if (!textContainsHttpUrl(text)) return null;
  return (
    <div className="mt-1 rounded-md border border-sky-100/90 bg-sky-50/50 px-2 py-1.5 text-[10px] leading-snug text-slate-700">
      <LinkifiedText text={text} className="text-[10px] leading-snug text-slate-800" />
    </div>
  );
}

function SlotLessonDetailOverlay({
  lesson,
  dayName,
  unitStore,
  onClose,
  onSave,
  onOpenAccentPicker,
  onTimerReset,
}) {
  const isDemoPlaceholderSlot = isMondayP1Lesson(dayName, lesson.period);
  const [lessonTopic, setLessonTopic] = useState("");
  const [time, setTime] = useState(lesson.time ?? "");
  const [room, setRoom] = useState(lesson.room ?? "");
  const [note, setNote] = useState(lesson.note ?? "");
  const [headerLabelDraft, setHeaderLabelDraft] = useState(() => lessonHeaderTitleForEdit(lesson));
  const [urgent, setUrgent] = useState(Boolean(lesson.urgent));
  const [durationMins, setDurationMins] = useState(70);
  const [unitTitle, setUnitTitle] = useState("");
  const [learningIntention, setLearningIntention] = useState("");
  const [successCriteria, setSuccessCriteria] = useState([""]);
  const [sequence, setSequence] = useState(() =>
    ADD_LESSON_SEQUENCE_DEFAULTS.map((phase) => ({ phase, text: "" }))
  );
  const [resources, setResources] = useState("");
  const [homework, setHomework] = useState("");
  const [teacherNote, setTeacherNote] = useState("");
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);
  const focusMenuWrapRef = useRef(null);

  useEffect(() => {
    const lpInit = lessonPlanEditorsFromLesson(lesson);
    setDurationMins(lpInit.durationMins);
    setUnitTitle(lpInit.unitTitle);
    setLessonTopic(lpInit.lessonTopic);
    setLearningIntention(lpInit.learningIntention);
    setSuccessCriteria(lpInit.successCriteria);
    setSequence(lpInit.sequence);
    setResources(lpInit.resources);
    setHomework(lpInit.homework);
    setTeacherNote(lpInit.teacherNote);
  }, [lesson.id]);

  useEffect(() => {
    setTime(lesson.time ?? "");
    setRoom(lesson.room ?? "");
    setNote(lesson.note ?? "");
    setUrgent(Boolean(lesson.urgent));
  }, [lesson.id, lesson.time, lesson.room, lesson.note, lesson.urgent]);

  useEffect(() => {
    setHeaderLabelDraft(lessonHeaderTitleForEdit(lesson));
  }, [lesson.id]);

  const accentOpt = lessonAccentOption(lesson);
  const defaultPhaseSet = useMemo(() => new Set(ADD_LESSON_SEQUENCE_DEFAULTS), []);
  const plannerClassLabel = lessonSlotDisplayTitle(lesson);
  const unitsForClass = useMemo(() => {
    if (!plannerClassLabel || plannerClassLabel === "—") return [];
    const list = unitStore?.byClass?.[plannerClassLabel];
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const ta = new Date(a.savedAt).getTime();
      const tb = new Date(b.savedAt).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }, [unitStore, plannerClassLabel]);
  const unitTitleOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const u of unitsForClass) {
      const t = String(u?.unitTitle ?? "").trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [unitsForClass]);
  const selectedUnit = useMemo(
    () => unitsForClass.find((u) => String(u?.unitTitle ?? "").trim() === unitTitle.trim()) ?? null,
    [unitsForClass, unitTitle]
  );
  const selectedUnitFocusOptions = useMemo(() => {
    if (!selectedUnit || !Array.isArray(selectedUnit.lessonFocuses)) return [];
    return selectedUnit.lessonFocuses.map((f) => String(f ?? "").trim()).filter(Boolean);
  }, [selectedUnit]);

  useEffect(() => {
    const current = unitTitle.trim();
    if (!current) return;
    if (unitTitleOptions.includes(current)) return;
    setUnitTitle("");
  }, [unitTitle, unitTitleOptions]);

  useEffect(() => {
    if (!focusMenuOpen) return;
    const onPointer = (e) => {
      if (focusMenuWrapRef.current?.contains(e.target)) return;
      setFocusMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [focusMenuOpen]);

  const field =
    "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-400";
  const lab = "mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400";

  function buildLessonPlanForSave() {
    const n = Number(durationMins);
    const dm = Number.isFinite(n) && n > 0 ? Math.min(320, Math.round(n)) : 70;
    return {
      durationMins: dm,
      unitTitle: unitTitle.trim(),
      lessonTopic: lessonTopic.trim(),
      learningIntention: learningIntention.trim(),
      successCriteria: successCriteria.map((s) => String(s).trim()).filter(Boolean),
      sequence: sequence
        .map((s) => ({
          phase: String(s.phase || "").trim() || "Step",
          text: String(s.text || "").trim(),
        }))
        .filter((s) => s.text),
      resources: resources.trim(),
      homework: homework.trim(),
      teacherNote: teacherNote.trim(),
    };
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/25"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-1/2 z-[61] flex max-h-[min(88vh,40rem)] w-[min(calc(100%-10px),26rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="slot-lesson-title"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">Lesson</p>
            <input
              id="slot-lesson-title"
              type="text"
              value={headerLabelDraft}
              onChange={(e) => setHeaderLabelDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder={DEFAULT_CLASS_SUBJECT_PLACEHOLDER}
              className="mt-0.5 w-full min-w-0 truncate border-0 border-b border-transparent bg-transparent p-0 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400/70 focus:border-slate-200"
              aria-label="Lesson title"
            />
            <PlanningLinkPreview text={headerLabelDraft} />
            {(room ?? "").trim() ? (
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{room.trim()}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-lesson-accent-hit
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onOpenAccentPicker(lesson.id, {
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                });
              }}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
              title={accentOpt.label}
            >
              Colour
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          <div className="space-y-2.5">
            <div>
              <label className={lab}>Unit title</label>
              {unitTitleOptions.length === 0 ? (
                <p className="rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                  No saved units for this class yet.
                </p>
              ) : (
                <select
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className={cn(field, "mb-2")}
                >
                  <option value="">Select unit title</option>
                  {unitTitleOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              )}
              <label className={lab}>Lesson focus</label>
              <div ref={focusMenuWrapRef} className="relative">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={lessonTopic}
                    onFocus={() => setFocusMenuOpen(true)}
                    onChange={(e) => {
                      setLessonTopic(e.target.value);
                      setFocusMenuOpen(true);
                    }}
                    className={cn(field, "min-w-0 flex-1")}
                    placeholder={DEFAULT_LESSON_FOCUS_PLACEHOLDER}
                  />
                  {selectedUnitFocusOptions.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setFocusMenuOpen((v) => !v)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Show lesson focus options"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", focusMenuOpen && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
                {focusMenuOpen && selectedUnitFocusOptions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {selectedUnitFocusOptions.map((focus) => (
                      <button
                        key={focus}
                        type="button"
                        onClick={() => {
                          setLessonTopic(focus);
                          setFocusMenuOpen(false);
                        }}
                        className="flex w-full rounded-md px-2 py-1.5 text-left text-[12px] text-slate-700 transition hover:bg-slate-50"
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <PlanningLinkPreview text={lessonTopic} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lab}>Time</label>
                <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
              </div>
              <div>
                <label className={lab}>Room</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder={DEFAULT_ROOM_PLACEHOLDER}
                  className={cn(field, "placeholder:text-slate-400/70")}
                />
              </div>
              <div>
                <label className={lab}>Mins</label>
                <input
                  type="number"
                  min={5}
                  max={320}
                  step={5}
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  className={cn(field, "tabular-nums")}
                />
              </div>
            </div>
            <div>
              <label className={lab}>Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onFocus={(e) => e.target.select()}
                rows={3}
                placeholder={isDemoPlaceholderSlot ? DEFAULT_LINE_NOTE_PLACEHOLDER : ""}
                className={cn(
                  field,
                  "resize-y border-transparent bg-transparent text-sm leading-snug shadow-none ring-0 placeholder:text-slate-400/60 focus:border-slate-300/40"
                )}
              />
              <PlanningLinkPreview text={note} />
            </div>

            <div>
              <label className={lab}>Learning intention</label>
              <textarea
                value={learningIntention}
                onChange={(e) => setLearningIntention(e.target.value)}
                rows={2}
                className={cn(field, "resize-y text-sm leading-snug")}
              />
              <PlanningLinkPreview text={learningIntention} />
            </div>

            <div>
              <label className={lab}>Success criteria</label>
              <div className="space-y-1.5">
                {successCriteria.map((row, i) => (
                  <div key={i}>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={row}
                        onChange={(e) =>
                          setSuccessCriteria((prev) =>
                            prev.map((t, j) => (j === i ? e.target.value : t))
                          )
                        }
                        className={field}
                        placeholder="Criterion"
                      />
                      {successCriteria.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSuccessCriteria((prev) => prev.filter((_, j) => j !== i))
                          }
                          className="shrink-0 rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove criterion"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                    <PlanningLinkPreview text={row} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSuccessCriteria((prev) => [...prev, ""]);
                }}
                className="mt-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                + Add criterion
              </button>
            </div>

            <div>
              <label className={lab}>Lesson sequence</label>
              <div className="space-y-2">
                {sequence.map((row, i) => {
                  const showPhaseInput = !defaultPhaseSet.has(row.phase);
                  return (
                    <div key={i} className="flex gap-2">
                      <div className="w-[5.25rem] shrink-0 pt-1.5">
                        {showPhaseInput ? (
                          <input
                            type="text"
                            value={row.phase}
                            onChange={(e) =>
                              setSequence((prev) =>
                                prev.map((s, j) =>
                                  j === i ? { ...s, phase: e.target.value } : s
                                )
                              )
                            }
                            className={cn(field, "px-2 py-1 text-xs")}
                            placeholder="Phase"
                          />
                        ) : (
                          <span className="text-[11px] font-medium leading-snug text-slate-600">{row.phase}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={row.text}
                          onChange={(e) =>
                            setSequence((prev) =>
                              prev.map((s, j) => (j === i ? { ...s, text: e.target.value } : s))
                            )
                          }
                          className={field}
                          placeholder="What happens in this part?"
                        />
                        <PlanningLinkPreview text={row.text} />
                      </div>
                      {sequence.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setSequence((prev) => prev.filter((_, j) => j !== i))}
                          className="mt-1 shrink-0 self-start rounded-md px-1.5 py-0.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove step"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSequence((prev) => [...prev, { phase: "", text: "" }]);
                }}
                className="mt-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                + Add step
              </button>
            </div>

            <div>
              <label className={lab}>Resources</label>
              <textarea
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                rows={2}
                className={cn(field, "resize-y text-sm leading-snug")}
                placeholder="Slides, handouts, links…"
              />
              <PlanningLinkPreview text={resources} />
            </div>

            <div>
              <label className={lab}>Homework / follow-up</label>
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                rows={2}
                className={cn(field, "resize-y text-sm leading-snug")}
              />
              <PlanningLinkPreview text={homework} />
            </div>

            <div className="rounded-lg border border-amber-200/70 bg-amber-50/40 px-2.5 py-2">
              <label className={cn(lab, "text-amber-900/80")}>Private teacher note</label>
              <textarea
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                rows={3}
                className={cn(field, "mt-1 resize-y border-amber-200/80 bg-white text-sm leading-snug")}
                placeholder="Only you — not shown on the timetable card"
              />
              <PlanningLinkPreview text={teacherNote} />
            </div>

            <button
              type="button"
              onClick={() => setUrgent((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition",
                urgent ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className="font-medium">Mark as urgent</span>
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2">
          <button
            type="button"
            onClick={onTimerReset}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset timer
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const builtLp = buildLessonPlanForSave();
                const hasStructured = hasStructuredLessonPlanPublicContent(builtLp);
                const t = note.trim();
                const nextNote = hasStructured ? t : t || "—";
                const titleTrim = headerLabelDraft.trim() || "—";
                onSave({
                  subject: titleTrim,
                  classGroup: "",
                  time: time.trim() || "—",
                  room: room.trim() || "Room",
                  note: nextNote,
                  urgent,
                  lessonPlan: builtLp,
                });
              }}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-95"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DutyRow({
  duty,
  editingField,
  editingValue,
  onStartEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  dayName,
  insertCellsAtAnchor,
  removeCellsAtAnchor,
}) {
  const isFilled = duty.label.trim() !== "";
  const isEditingLabel = editingField?.itemId === duty.id && editingField?.field === "label";
  const isEditingTime = editingField?.itemId === duty.id && editingField?.field === "time";
  const [plusMenuAnchor, setPlusMenuAnchor] = useState(null);
  const [cellModal, setCellModal] = useState(null);
  const plusBtnRef = useRef(null);

  useEffect(() => {
    if (!plusMenuAnchor) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPlusMenuAnchor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plusMenuAnchor]);

  function closePlusMenu() {
    setPlusMenuAnchor(null);
  }

  function togglePlusMenu() {
    if (plusMenuAnchor) {
      closePlusMenu();
      return;
    }
    const r = plusBtnRef.current?.getBoundingClientRect();
    if (r) setPlusMenuAnchor({ left: r.left, right: r.right, bottom: r.bottom, top: r.top });
  }

  const panelW = 200;
  const dutyPlusMenuPortal =
    insertCellsAtAnchor &&
    removeCellsAtAnchor &&
    typeof document !== "undefined" &&
    plusMenuAnchor
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              aria-hidden
              onClick={(e) => {
                e.stopPropagation();
                closePlusMenu();
              }}
            />
            <div
              role="menu"
              aria-label="Duty row actions"
              className="fixed z-[101] w-[min(14rem,calc(100vw-16px))] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg"
              style={{
                top: anchoredPopoverTop(plusMenuAnchor, 180),
                left: Math.max(
                  8,
                  Math.min(
                    plusMenuAnchor.left,
                    (typeof window !== "undefined" ? window.innerWidth : 400) - 8 - panelW
                  )
                ),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Cell
              </p>
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  closePlusMenu();
                  setCellModal("add");
                }}
              >
                Add cell…
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  closePlusMenu();
                  setCellModal("remove");
                }}
              >
                Remove cell…
              </button>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className={cn(
          "flex w-full items-center overflow-hidden whitespace-nowrap rounded-[5px] border px-2 py-1 text-[10px] leading-4 transition",
          isFilled
            ? "border-red-200/80 bg-red-50/70 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
        )}
      >
        {isFilled ? (
          <>
            <span className="shrink-0 text-[10px] font-semibold text-red-700">DUTY</span>
            <span className="mx-1 shrink-0 text-red-300">·</span>
          </>
        ) : null}
        {isEditingLabel ? (
          <input
            autoFocus
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
            className="min-w-0 flex-1 rounded-[3px] border border-slate-300 bg-white px-1 text-[10px] text-slate-900 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => onStartEdit(duty.id, "label", duty.label, "duty")}
            className={cn(
              "min-w-0 flex-1 truncate text-left font-medium",
              isFilled ? "hover:text-red-900" : "hover:text-slate-700",
              !isFilled && !duty.label && "italic opacity-60"
            )}
          >
            {duty.label || "Click to add duty..."}
          </button>
        )}
        <span className={cn("mx-1 shrink-0", isFilled ? "text-red-300" : "text-slate-300")}>·</span>
        {isEditingTime ? (
          <input
            autoFocus
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
            className="w-12 shrink-0 rounded-[3px] border border-slate-300 bg-white px-1 text-[10px] text-slate-900 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => onStartEdit(duty.id, "time", duty.time, "duty")}
            className={cn("shrink-0", isFilled ? "hover:text-red-900" : "hover:text-slate-700")}
          >
            {duty.time || "Time"}
          </button>
        )}
        {insertCellsAtAnchor && removeCellsAtAnchor ? (
          <button
            ref={plusBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlusMenu();
            }}
            className="ml-1 flex h-6 w-5 shrink-0 items-center justify-center rounded text-slate-400/90 transition hover:bg-slate-200/80 hover:text-slate-600"
            aria-label="Row actions"
            aria-expanded={Boolean(plusMenuAnchor)}
            aria-haspopup="menu"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {dutyPlusMenuPortal}
      <ScheduleCellModal
        variant={cellModal}
        anchorDayName={dayName}
        onClose={() => setCellModal(null)}
        onAdd={(payload) => {
          insertCellsAtAnchor({
            anchorDayName: dayName,
            anchorItemId: duty.id,
            position: payload.position,
            kind: payload.kind,
            targetDays: payload.targetDays,
          });
          setCellModal(null);
        }}
        onRemove={(payload) => {
          removeCellsAtAnchor({
            anchorDayName: dayName,
            anchorItemId: duty.id,
            targetDays: payload.targetDays,
          });
          setCellModal(null);
        }}
      />
    </>
  );
}

const TEACHER_STUDIO_STORAGE_KEY = "teacher-studio-app-state-v1";
const TEACHER_STUDIO_INITIALIZED_KEY = "teacherStudio_initialized";
const TEACHER_STUDIO_FONT_STORAGE_KEY = "teaching-studio-font-scale";
const TEACHER_STUDIO_ARCHIVES_STORAGE_KEY = "teacher-studio-archives-v1";
const TEACHER_STUDIO_ARCHIVES_MAX = 25;
const FONT_SCALE_MIN = 0.9;
const FONT_SCALE_MAX = 1.8;
const FONT_SCALE_STEP = 0.1;

const defaultCalendarReminders = [
  { id: "cal-1", date: 25, month: 2, year: 2026, title: "Parent evening — bring snacks", kind: "event" },
  { id: "cal-2", date: 27, month: 2, year: 2026, title: "Moderation: deep breaths required", kind: "task" },
  { id: "cal-3", date: 31, month: 2, year: 2026, title: "Staff photos (smile if you mean it)", kind: "event" },
  { id: "cal-4", date: 20, month: 3, year: 2026, title: "Sports day — sunblock advisory", kind: "event" },
];

function readTeacherStudioArchives() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TEACHER_STUDIO_ARCHIVES_STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || !Array.isArray(p.archives)) return [];
    return p.archives.filter(
      (a) =>
        a &&
        typeof a === "object" &&
        typeof a.id === "string" &&
        a.snapshot &&
        typeof a.snapshot === "object" &&
        a.snapshot.app &&
        typeof a.snapshot.app === "object"
    );
  } catch {
    return [];
  }
}

function writeTeacherStudioArchives(archives) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEACHER_STUDIO_ARCHIVES_STORAGE_KEY, JSON.stringify({ archives }));
  } catch {
    /* quota / private mode */
  }
}

function appPayloadLooksLikeTeacherStudio(app) {
  if (!app || typeof app !== "object") return false;
  if (app.baseTimetable && isValidTimetable(app.baseTimetable)) return true;
  if (app.timetable && isValidTimetable(app.timetable)) return true;
  return false;
}

/** Parse JSON from an export file, archive export, or legacy saved payload. */
function normalizeTeacherStudioImportJson(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.teacherStudioExport === true && parsed.app && typeof parsed.app === "object") {
    return {
      app: parsed.app,
      extra: parsed.extra && typeof parsed.extra === "object" ? parsed.extra : undefined,
    };
  }
  if (parsed.v === 1 && parsed.app && typeof parsed.app === "object" && parsed.extra && typeof parsed.extra === "object") {
    return { app: parsed.app, extra: parsed.extra };
  }
  if (parsed.app && typeof parsed.app === "object") {
    return {
      app: parsed.app,
      extra: parsed.extra && typeof parsed.extra === "object" ? parsed.extra : undefined,
    };
  }
  if (appPayloadLooksLikeTeacherStudio(parsed)) {
    return { app: parsed, extra: undefined };
  }
  return null;
}

/** Write merged app payload + optional extras to localStorage (same rules as archive restore). */
function writeTeacherStudioSnapshotToLocalStorage(snapshot) {
  if (typeof window === "undefined") return;
  const app = snapshot?.app;
  if (!app || typeof app !== "object") throw new Error("Invalid backup.");
  if (!appPayloadLooksLikeTeacherStudio(app)) {
    throw new Error("This file does not look like a Teacher Studio backup.");
  }
  window.localStorage.setItem(TEACHER_STUDIO_STORAGE_KEY, JSON.stringify(app));
  const extra = snapshot.extra;
  if (extra && typeof extra === "object") {
    if (extra.hasWeekTemplate && extra.weekTemplate != null) {
      window.localStorage.setItem(WEEK_TEMPLATE_STORAGE_KEY, extra.weekTemplate);
    } else {
      window.localStorage.removeItem(WEEK_TEMPLATE_STORAGE_KEY);
    }
    if (typeof extra.unitPlannerJson === "string") {
      window.localStorage.setItem(UNIT_PLANNER_STORAGE_KEY, extra.unitPlannerJson);
    }
    if (extra.fontScale != null && String(extra.fontScale).trim() !== "") {
      window.localStorage.setItem(TEACHER_STUDIO_FONT_STORAGE_KEY, String(extra.fontScale));
    } else if (typeof app.fontScale === "number" && Number.isFinite(app.fontScale)) {
      window.localStorage.setItem(TEACHER_STUDIO_FONT_STORAGE_KEY, String(app.fontScale));
    } else {
      window.localStorage.removeItem(TEACHER_STUDIO_FONT_STORAGE_KEY);
    }
  } else {
    if (typeof app.fontScale === "number" && Number.isFinite(app.fontScale)) {
      window.localStorage.setItem(TEACHER_STUDIO_FONT_STORAGE_KEY, String(app.fontScale));
    }
  }
}

function downloadBrowserJsonFile(filename, dataObject) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(dataObject, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function defaultExpandedDays() {
  return Object.fromEntries(timetableTemplate.map((day) => [day.day, false]));
}

function isValidTimetable(data) {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every((d) => d && typeof d.day === "string" && Array.isArray(d.items))
  );
}

function normalizeTimetableSlotPlanned(timetable) {
  return timetable.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (item.type !== "lesson") return item;
      if (typeof item.slotPlanned === "boolean") return item;
      return { ...item, slotPlanned: false };
    }),
  }));
}

/** Wednesday template only has P1–P4; strip any other lesson rows (e.g. old P5+ or bad saves). */
function stripWednesdayLessonsToTemplatePeriods(timetable) {
  const allowed = new Set(["P1", "P2", "P3", "P4"]);
  let changed = false;
  const next = timetable.map((day) => {
    if (day.day !== "Wednesday") return day;
    const filtered = day.items.filter((item) => item.type !== "lesson" || allowed.has(item.period));
    if (filtered.length === day.items.length) return day;
    changed = true;
    return { ...day, items: filtered };
  });
  return changed ? next : timetable;
}

function emptyWeekLessonOverlays() {
  return Object.fromEntries(TERM_WEEKS.map((w) => [w, {}]));
}

/**
 * Full reset: keep period times & row layout; clear lesson title/room/class and duty labels.
 * Demo template subjects/rooms live in the base scaffold — mergePersistedAppState(null) alone would keep them.
 */
function blankTimetableForFullResetFromTemplate(timetable) {
  return normalizeTimetableForStorage(
    timetable.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.type === "duty") {
          return { id: item.id, type: "duty", label: "", time: item.time ?? "" };
        }
        if (item.type === "lesson") {
          const b = {
            id: item.id,
            type: "lesson",
            period: item.period,
            time: item.time,
            subject: "",
            room: "",
          };
          if (item.accent !== undefined && item.accent !== null) b.accent = item.accent;
          return b;
        }
        return cloneTimetable(item);
      }),
    }))
  );
}

/** Allowed fields on the shared base timetable for a lesson (no notes / plans / weekly flags). */
function lessonItemBaseShell(item) {
  if (item.type !== "lesson") return item;
  const b = {
    id: item.id,
    type: "lesson",
    period: item.period,
    time: item.time,
    subject: item.subject,
    room: item.room,
  };
  if (item.classGroup) b.classGroup = item.classGroup;
  if (item.accent !== undefined && item.accent !== null) b.accent = item.accent;
  return b;
}

/** Remove any weekly fields accidentally stored on base (legacy / bad saves). */
function stripWeeklyFieldsFromBaseTimetable(timetable) {
  return timetable.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (item.type === "duty") {
        return { id: item.id, type: "duty", label: item.label ?? "", time: item.time ?? "" };
      }
      if (item.type === "lesson") return lessonItemBaseShell(item);
      return cloneTimetable(item);
    }),
  }));
}

/** Merged view for UI: shared base scaffold + per-week lesson notes / plans only. */
function mergeBaseWithWeeklyOverlays(baseTimetable, overlayByLessonId) {
  const ov = overlayByLessonId ?? {};
  return baseTimetable.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (item.type === "duty") {
        return {
          id: item.id,
          type: "duty",
          label: item.label ?? "",
          time: item.time ?? "",
        };
      }
      if (item.type !== "lesson") return cloneTimetable(item);
      const shell = lessonItemBaseShell(item);
      const w = ov[item.id] ?? {};
      const merged = {
        ...shell,
        note: typeof w.note === "string" ? w.note : "",
        urgent: Boolean(w.urgent),
        slotPlanned: Boolean(w.slotPlanned),
      };
      if (w.lineNote) merged.lineNote = w.lineNote;
      if (w.lessonPlan && typeof w.lessonPlan === "object") merged.lessonPlan = cloneTimetable(w.lessonPlan);
      return merged;
    }),
  }));
}

/** Strip weekly-only lesson fields for the shared base timetable. */
function extractBaseTimetableFromMerged(merged) {
  return merged.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (item.type === "duty") {
        return { id: item.id, type: "duty", label: item.label ?? "", time: item.time ?? "" };
      }
      if (item.type === "lesson") return lessonItemBaseShell(item);
      return item;
    }),
  }));
}

/** Per-lesson weekly payload (notes, plans) from a merged timetable row. */
function extractWeeklyOverlayFromMerged(merged) {
  const map = {};
  for (const day of merged) {
    for (const item of day.items) {
      if (item.type !== "lesson") continue;
      const w = {};
      if ((item.note ?? "").trim()) w.note = item.note;
      if (item.lineNote && String(item.lineNote).trim()) w.lineNote = item.lineNote;
      if (item.urgent) w.urgent = true;
      if (item.slotPlanned) w.slotPlanned = true;
      if (item.lessonPlan && typeof item.lessonPlan === "object" && Object.keys(item.lessonPlan).length > 0) {
        w.lessonPlan = cloneTimetable(item.lessonPlan);
      }
      if (Object.keys(w).length > 0) map[item.id] = w;
    }
  }
  return map;
}

function extractWeeklyOverlayFromFullRelativeToBase(fullTimetable, baseTimetable) {
  const map = {};
  for (let di = 0; di < fullTimetable.length; di++) {
    const fd = fullTimetable[di];
    const bd = baseTimetable[di];
    if (!bd) continue;
    for (const item of fd.items) {
      if (item.type !== "lesson") continue;
      const bi = bd.items.find((x) => x.id === item.id && x.type === "lesson");
      if (!bi) continue;
      const w = {};
      if ((item.note ?? "") !== (bi.note ?? "")) w.note = item.note ?? "";
      if ((item.lineNote ?? "") !== (bi.lineNote ?? "")) {
        if (item.lineNote) w.lineNote = item.lineNote;
      }
      if (Boolean(item.urgent) !== Boolean(bi.urgent)) w.urgent = item.urgent;
      if (Boolean(item.slotPlanned) !== Boolean(bi.slotPlanned)) w.slotPlanned = item.slotPlanned;
      const pj = item.lessonPlan ? JSON.stringify(item.lessonPlan) : "";
      const pjb = bi.lessonPlan ? JSON.stringify(bi.lessonPlan) : "";
      if (pj !== pjb && item.lessonPlan) w.lessonPlan = cloneTimetable(item.lessonPlan);
      if (Object.keys(w).length) map[item.id] = w;
    }
  }
  return map;
}

function migratePersistedToBaseAndWeekOverlays(raw, legacyTimetable, selectedWeekLabel) {
  const legacyNorm = normalizeTimetableForStorage(legacyTimetable);

  if (raw?.baseTimetable && isValidTimetable(raw.baseTimetable)) {
    const base = normalizeTimetableForStorage(cloneTimetable(raw.baseTimetable));
    const overlays = emptyWeekLessonOverlays();
    const rawOv = raw.weekLessonOverlays;
    if (rawOv && typeof rawOv === "object" && !Array.isArray(rawOv)) {
      for (const w of TERM_WEEKS) {
        const ow = rawOv[w];
        if (ow && typeof ow === "object" && !Array.isArray(ow)) {
          const clean = {};
          for (const [id, patch] of Object.entries(ow)) {
            if (!patch || typeof patch !== "object") continue;
            clean[id] = cloneTimetable(patch);
          }
          overlays[w] = clean;
        }
      }
    }
    return {
      baseTimetable: stripWeeklyFieldsFromBaseTimetable(base),
      weekLessonOverlays: overlays,
    };
  }

  const canonicalSource =
    raw?.weekTimetables?.[selectedWeekLabel] && isValidTimetable(raw.weekTimetables[selectedWeekLabel])
      ? raw.weekTimetables[selectedWeekLabel]
      : legacyNorm;
  const canonicalNorm = normalizeTimetableForStorage(cloneTimetable(canonicalSource));
  const baseTimetable = stripWeeklyFieldsFromBaseTimetable(
    normalizeTimetableForStorage(extractBaseTimetableFromMerged(canonicalNorm))
  );
  const overlays = emptyWeekLessonOverlays();

  if (
    raw?.weekTimetables &&
    typeof raw.weekTimetables === "object" &&
    raw.weekTimetables !== null &&
    !Array.isArray(raw.weekTimetables)
  ) {
    for (const w of TERM_WEEKS) {
      const full = raw.weekTimetables[w];
      if (full && isValidTimetable(full)) {
        const norm = normalizeTimetableForStorage(cloneTimetable(full));
        overlays[w] = extractWeeklyOverlayFromFullRelativeToBase(norm, baseTimetable);
      }
    }
    return { baseTimetable, weekLessonOverlays: overlays };
  }

  overlays[selectedWeekLabel] = extractWeeklyOverlayFromFullRelativeToBase(legacyNorm, baseTimetable);
  return { baseTimetable, weekLessonOverlays: overlays };
}

const WEEK_TEMPLATE_STORAGE_KEY = "teacher-studio-week-template-v1";

function readWeekTemplateFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEEK_TEMPLATE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !isValidTimetable(p.timetable)) return null;
    return {
      savedAt: typeof p.savedAt === "string" ? p.savedAt : null,
      timetable: normalizeTimetableSlotPlanned(stripWednesdayLessonsToTemplatePeriods(p.timetable)),
    };
  } catch {
    return null;
  }
}

function writeWeekTemplateToStorage(timetable) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      timetable: JSON.parse(JSON.stringify(timetable)),
    };
    window.localStorage.setItem(WEEK_TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

const UNIT_PLANNER_STORAGE_KEY = "teacher-studio-unit-planner-v1";

function newUnitPlannerId() {
  return `unit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readUnitPlannerFromStorage() {
  if (typeof window === "undefined") return { byClass: {} };
  try {
    const raw = window.localStorage.getItem(UNIT_PLANNER_STORAGE_KEY);
    if (!raw) return { byClass: {} };
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || !p.byClass || typeof p.byClass !== "object") return { byClass: {} };
    const byClass = {};
    for (const [classKey, list] of Object.entries(p.byClass)) {
      if (typeof classKey !== "string" || !Array.isArray(list)) continue;
      byClass[classKey] = list
        .filter((u) => u && typeof u === "object" && typeof u.unitTitle === "string")
        .map((u) => ({
          id: typeof u.id === "string" && u.id ? u.id : newUnitPlannerId(),
          unitTitle: String(u.unitTitle).trim().slice(0, 240),
          lessonFocuses: Array.isArray(u.lessonFocuses)
            ? u.lessonFocuses.map((t) => String(t ?? "").trim()).filter(Boolean).slice(0, 48)
            : [],
          savedAt: typeof u.savedAt === "string" ? u.savedAt : new Date().toISOString(),
        }))
        .filter((u) => u.unitTitle && u.lessonFocuses.length > 0);
    }
    return { byClass };
  } catch {
    return { byClass: {} };
  }
}

function writeUnitPlannerToStorage(store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNIT_PLANNER_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/** Unique class labels from timetable lesson slots (e.g. “7E English”). */
function collectTimetableClassLabels(timetable) {
  const set = new Set();
  if (!Array.isArray(timetable)) return [];
  for (const day of timetable) {
    if (!day?.items) continue;
    for (const item of day.items) {
      if (item.type !== "lesson") continue;
      const label = lessonSlotDisplayTitle(item);
      if (label && label !== "—") set.add(label);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function templateLessonForPeriod(dayName, period) {
  const d = timetableTemplate.find((x) => x.day === dayName);
  return d?.items.find((i) => i.type === "lesson" && i.period === period) ?? null;
}

function clearNotesOnDay(dayObj) {
  return {
    ...dayObj,
    items: dayObj.items.map((item) => {
      if (item.type !== "lesson") return item;
      const next = { ...item };
      next.note = "";
      delete next.lineNote;
      return next;
    }),
  };
}

/** Start New Term — keep live scaffold (subject, room, time, period, duties, accent, classGroup); strip only notes/plans/flags. */
function stripLessonContentFromMergedDay(dayObj) {
  return {
    ...dayObj,
    items: dayObj.items.map((item) => {
      if (item.type !== "lesson") return item;
      const next = { ...item };
      next.note = "";
      delete next.lineNote;
      delete next.lessonPlan;
      next.urgent = false;
      next.slotPlanned = false;
      return next;
    }),
  };
}

function summarizeTimetableStructureForLog(tag, mergedTimetable) {
  if (typeof console === "undefined" || !Array.isArray(mergedTimetable)) return;
  const summary = mergedTimetable.map((d) => ({
    day: d.day,
    slots: d.items.map((it) =>
      it.type === "duty"
        ? { type: "duty", label: it.label, time: it.time }
        : {
            type: "lesson",
            period: it.period,
            subject: it.subject,
            room: it.room,
            classGroup: it.classGroup ?? "",
          }
    ),
  }));
  console.log(`[TeacherStudio] ${tag}`, summary);
}

function clearLessonsOnDay(dayObj) {
  const dayName = dayObj.day;
  return {
    ...dayObj,
    items: dayObj.items.map((item) => {
      if (item.type !== "lesson") return item;
      const tmpl = templateLessonForPeriod(dayName, item.period);
      if (!tmpl) return item;
      const { id, period } = item;
      const shell = lessonItemBaseShell({ ...tmpl, id, type: "lesson", period });
      return {
        ...shell,
        note: "",
        urgent: false,
        slotPlanned: false,
      };
    }),
  };
}

/** Reset day to template scaffold; keep existing item ids for stable keys. */
function resetDayToTemplate(currentDay, templateDay) {
  return {
    ...currentDay,
    items: templateDay.items.map((tmpl, i) => {
      const cur = currentDay.items[i];
      const id = cur?.id ?? tmpl.id;
      if (tmpl.type === "duty") {
        return { ...tmpl, id };
      }
      return {
        ...tmpl,
        id,
        period: tmpl.period,
      };
    }),
  };
}

function clampFontScale(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n));
}

function readPersistedAppState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEACHER_STUDIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isTeacherStudioInitialized() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TEACHER_STUDIO_INITIALIZED_KEY) === "true";
  } catch {
    return false;
  }
}

function markTeacherStudioInitialized() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEACHER_STUDIO_INITIALIZED_KEY, "true");
  } catch {
    /* ignore */
  }
}

/** Cleared scaffold from template (structure + default slot shells); no first-run demo calendar. */
function buildScaffoldTimetableFromTemplate() {
  const cleared = timetableTemplate.map((day) =>
    clearNotesOnDay(clearLessonsOnDay(JSON.parse(JSON.stringify(day))))
  );
  return normalizeTimetableForStorage(cleared);
}

function normalizeMonthViewDayNotes(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || k.length > 14) continue;
    if (typeof v !== "string") continue;
    const t = v.length > 2000 ? v.slice(0, 2000) : v;
    const trimmed = t.trim();
    if (trimmed) out[k] = trimmed;
  }
  return out;
}

function normalizeStudentNotes(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const studentName = String(item.studentName ?? "").trim().slice(0, 120);
    const classLabel = String(item.classLabel ?? "").trim().slice(0, 160);
    const note = String(item.note ?? "").trim().slice(0, 4000);
    if (!studentName || !classLabel || !note) continue;
    const createdAt = typeof item.createdAt === "string" && item.createdAt ? item.createdAt : "";
    out.push({
      id: typeof item.id === "string" && item.id ? item.id : `sn-${i + 1}`,
      studentName,
      classLabel,
      quickChoice: typeof item.quickChoice === "string" ? item.quickChoice.slice(0, 80) : "",
      note,
      createdAt,
      week: typeof item.week === "string" ? item.week : "",
      day: typeof item.day === "string" ? item.day : "",
      period: typeof item.period === "string" ? item.period : "",
    });
  }
  return out;
}

function mergePersistedAppState(raw) {
  const defaultWeek1StartDate = isoDateFromLocalDate(schoolWeekMonday(new Date()));
  const today = new Date();
  const defaults = {
    sidebarCollapsed: false,
    focusMode: false,
    calendarReminders: defaultCalendarReminders,
    viewMode: "week",
    selectedDay: "Monday",
    selectedWeek: weekLabelForDate(defaultWeek1StartDate),
    timerSeconds: 12 * 60,
    editingTimer: false,
    timerInput: "12:00",
    timerRunning: false,
    timetable: timetableTemplate,
    lastViewMode: "week",
    expandedLessons: [],
    expandedDays: defaultExpandedDays(),
    fontScale: 1,
    searchQuery: "",
    calendarMonth: { year: today.getFullYear(), month: today.getMonth() },
    toolShortcuts: [],
    dayCountdownTarget: "2026-12-20",
    dayCountdownEventLabel: "Christmas",
    celebrations: [],
    bellReminderSettings: defaultBellReminderSettings(),
    monthViewDayNotes: {},
    studentNotes: [],
    week1StartDate: defaultWeek1StartDate,
  };

  if (!raw) {
    if (isTeacherStudioInitialized()) {
      console.log(
        "[TeacherStudio init] Missing app state key; teacherStudio_initialized is set — using cleared scaffold from template (no full demo reseed)."
      );
      const scaffoldTimetable = buildScaffoldTimetableFromTemplate();
      let fontScale = defaults.fontScale;
      if (typeof window !== "undefined") {
        try {
          const legacyFont = window.localStorage.getItem(TEACHER_STUDIO_FONT_STORAGE_KEY);
          if (legacyFont) {
            const n = Number(legacyFont);
            if (Number.isFinite(n)) fontScale = clampFontScale(n);
          }
        } catch {
          /* ignore */
        }
      }
      const { baseTimetable, weekLessonOverlays } = migratePersistedToBaseAndWeekOverlays(
        null,
        scaffoldTimetable,
        defaults.selectedWeek
      );
      const timetable = normalizeTimetableForStorage(
        mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[defaults.selectedWeek] ?? {})
      );
      return {
        ...defaults,
        calendarReminders: [],
        celebrations: [],
        toolShortcuts: [],
        fontScale,
        baseTimetable,
        weekLessonOverlays,
        timetable,
      };
    }
    if (typeof window !== "undefined") {
      try {
        const legacyFont = window.localStorage.getItem(TEACHER_STUDIO_FONT_STORAGE_KEY);
        if (legacyFont) {
          const n = Number(legacyFont);
          if (Number.isFinite(n)) {
            const { baseTimetable, weekLessonOverlays } = migratePersistedToBaseAndWeekOverlays(
              null,
              defaults.timetable,
              defaults.selectedWeek
            );
            const timetable = normalizeTimetableForStorage(
              mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[defaults.selectedWeek] ?? {})
            );
            markTeacherStudioInitialized();
            console.log(
              "[TeacherStudio init] First run (legacy font key only): seeded defaults and set teacherStudio_initialized."
            );
            return {
              ...defaults,
              fontScale: clampFontScale(n),
              baseTimetable,
              weekLessonOverlays,
              timetable,
            };
          }
        }
      } catch {
        /* ignore */
      }
    }
    const { baseTimetable, weekLessonOverlays } = migratePersistedToBaseAndWeekOverlays(
      null,
      defaults.timetable,
      defaults.selectedWeek
    );
    const timetable = normalizeTimetableForStorage(
      mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[defaults.selectedWeek] ?? {})
    );
    markTeacherStudioInitialized();
    console.log("[TeacherStudio init] First run or post full-reset: full default seed; teacherStudio_initialized set.");
    return {
      ...defaults,
      baseTimetable,
      weekLessonOverlays,
      timetable,
    };
  }

  const timetableFallback =
    isTeacherStudioInitialized() && !isValidTimetable(raw.timetable)
      ? buildScaffoldTimetableFromTemplate()
      : defaults.timetable;

  const legacyTimetable = stripWednesdayLessonsToTemplatePeriods(
    normalizeTimetableSlotPlanned(
      isValidTimetable(raw.timetable) ? raw.timetable : timetableFallback
    )
  );

  let selectedWeek = typeof raw.selectedWeek === "string" ? raw.selectedWeek : defaults.selectedWeek;
  if (!TERM_WEEKS.includes(selectedWeek)) {
    selectedWeek = defaults.selectedWeek;
  }
  const parsedWeek1Start = parseIsoToLocalDate(raw.week1StartDate);
  const week1StartDate = parsedWeek1Start
    ? isoDateFromLocalDate(parsedWeek1Start)
    : defaults.week1StartDate;

  const { baseTimetable, weekLessonOverlays } = migratePersistedToBaseAndWeekOverlays(
    raw,
    legacyTimetable,
    selectedWeek
  );
  const timetable = normalizeTimetableForStorage(
    mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[selectedWeek] ?? {})
  );

  const dayNames = new Set(timetable.map((d) => d.day));
  let selectedDay = typeof raw.selectedDay === "string" ? raw.selectedDay : defaults.selectedDay;
  if (!dayNames.has(selectedDay)) {
    selectedDay = timetable[0]?.day ?? defaults.selectedDay;
  }

  const expandedDaysBase = Object.fromEntries(timetable.map((day) => [day.day, false]));
  const expandedDays =
    raw.expandedDays && typeof raw.expandedDays === "object" && !Array.isArray(raw.expandedDays)
      ? { ...expandedDaysBase, ...raw.expandedDays }
      : expandedDaysBase;

  let fontScale = defaults.fontScale;
  if (raw.fontScale !== undefined && raw.fontScale !== null) {
    fontScale = clampFontScale(Number(raw.fontScale));
  } else if (typeof window !== "undefined") {
    try {
      const legacyFont = window.localStorage.getItem(TEACHER_STUDIO_FONT_STORAGE_KEY);
      if (legacyFont) {
        const n = Number(legacyFont);
        if (Number.isFinite(n)) fontScale = clampFontScale(n);
      }
    } catch {
      /* ignore */
    }
  }

  const ts = Number(raw.timerSeconds);
  const timerSeconds = Number.isFinite(ts) && ts >= 0 ? Math.floor(ts) : defaults.timerSeconds;

  const cm = raw.calendarMonth;
  const calendarMonth =
    cm && Number.isFinite(cm.year) && Number.isFinite(cm.month) && cm.month >= 0 && cm.month <= 11
      ? { year: cm.year, month: cm.month }
      : defaults.calendarMonth;

  if (typeof window !== "undefined" && !isTeacherStudioInitialized()) {
    markTeacherStudioInitialized();
    console.log("[TeacherStudio init] Existing save found without init flag — migrated; teacherStudio_initialized set.");
  } else {
    console.log("[TeacherStudio init] Loaded from localStorage (no seed).");
  }

  return {
    sidebarCollapsed: typeof raw.sidebarCollapsed === "boolean" ? raw.sidebarCollapsed : defaults.sidebarCollapsed,
    focusMode: typeof raw.focusMode === "boolean" ? raw.focusMode : defaults.focusMode,
    calendarReminders: Array.isArray(raw.calendarReminders) ? raw.calendarReminders : defaults.calendarReminders,
    viewMode:
      raw.viewMode === "week" || raw.viewMode === "month" || raw.viewMode === "day"
        ? raw.viewMode
        : defaults.viewMode,
    selectedDay,
    selectedWeek,
    week1StartDate,
    timerSeconds,
    editingTimer: typeof raw.editingTimer === "boolean" ? raw.editingTimer : defaults.editingTimer,
    timerInput: typeof raw.timerInput === "string" ? raw.timerInput : defaults.timerInput,
    timerRunning: typeof raw.timerRunning === "boolean" ? raw.timerRunning : defaults.timerRunning,
    timetable,
    baseTimetable,
    weekLessonOverlays,
    lastViewMode:
      raw.lastViewMode === "week" || raw.lastViewMode === "month" || raw.lastViewMode === "day"
        ? raw.lastViewMode
        : defaults.lastViewMode,
    expandedLessons: Array.isArray(raw.expandedLessons) ? raw.expandedLessons : defaults.expandedLessons,
    expandedDays,
    fontScale,
    searchQuery: typeof raw.searchQuery === "string" ? raw.searchQuery : defaults.searchQuery,
    calendarMonth,
    toolShortcuts: normalizeToolShortcuts(raw.toolShortcuts ?? defaults.toolShortcuts),
    dayCountdownTarget: normalizeDayCountdownTarget(raw.dayCountdownTarget ?? defaults.dayCountdownTarget),
    dayCountdownEventLabel: normalizeDayCountdownEventLabel(
      raw.dayCountdownEventLabel ?? defaults.dayCountdownEventLabel
    ),
    celebrations: normalizeCelebrations(raw.celebrations ?? defaults.celebrations),
    bellReminderSettings: normalizeBellReminderSettings(raw.bellReminderSettings ?? defaults.bellReminderSettings),
    monthViewDayNotes: normalizeMonthViewDayNotes(raw.monthViewDayNotes ?? defaults.monthViewDayNotes),
    studentNotes: normalizeStudentNotes(raw.studentNotes ?? defaults.studentNotes),
  };
}

const initialAppState = mergePersistedAppState(
  typeof window !== "undefined" ? readPersistedAppState() : null
);

function anchorFromRect(rect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
  };
}

const DASHBOARD_BAR_TOOLTIP_DELAY_MS = 300;

/** Hover-only tooltip with a short delay; rendered in a portal so overflow on the tools strip does not clip it. */
function DelayedHoverTooltip({ label, children, className }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  }, []);

  const scheduleShow = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCoords({ left: r.left + r.width / 2, top: r.top });
      setOpen(true);
    }, DASHBOARD_BAR_TOOLTIP_DELAY_MS);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setCoords({ left: r.left + r.width / 2, top: r.top });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <>
      <span
        ref={wrapRef}
        className={cn("relative inline-flex", className)}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          scheduleShow();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "touch") return;
          hide();
        }}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[9999] max-w-[min(20rem,calc(100vw-1rem))] rounded-md bg-slate-900 px-2 py-1 text-center text-[11px] font-medium leading-snug text-white shadow-md"
            style={{
              left: coords.left,
              top: coords.top - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </>
  );
}

/** Bar shortcut: link-only; md+ hover opens parent flyout portal; touch long-press opens same flyout. */
function DashboardShortcutChip({
  shortcut,
  onOpenFlyout,
  onScheduleCloseFlyout,
  cancelCloseFlyout,
  suppressNavForIdRef,
}) {
  const wrapRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressStartRef = useRef({ x: 0, y: 0 });

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const isMdHoverDevice = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  return (
    <span
      ref={wrapRef}
      data-shortcut-pill
      className="relative shrink-0"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        if (!isMdHoverDevice()) return;
        cancelCloseFlyout();
        const el = wrapRef.current;
        if (!el) return;
        onOpenFlyout(shortcut, anchorFromRect(el.getBoundingClientRect()));
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") {
          clearLongPress();
          return;
        }
        if (e.pointerType !== "mouse") return;
        if (!isMdHoverDevice()) return;
        onScheduleCloseFlyout(shortcut.id);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        longPressStartRef.current = { x: e.clientX, y: e.clientY };
        clearLongPress();
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTimerRef.current = null;
          const el = wrapRef.current;
          if (!el) return;
          suppressNavForIdRef.current = shortcut.id;
          cancelCloseFlyout();
          onOpenFlyout(shortcut, anchorFromRect(el.getBoundingClientRect()));
        }, 520);
      }}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onPointerMove={(e) => {
        if (!longPressTimerRef.current || e.pointerType !== "touch") return;
        const dx = e.clientX - longPressStartRef.current.x;
        const dy = e.clientY - longPressStartRef.current.y;
        if (dx * dx + dy * dy > 100) clearLongPress();
      }}
    >
      <DelayedHoverTooltip
        label={
          shortcut.label?.trim()
            ? `${shortcut.label.trim()} — open link (new tab)`
            : shortcut.href
        }
      >
        <a
          href={shortcut.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-[10rem] items-center truncate rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          aria-label={`Open shortcut ${shortcut.label || shortcut.href}`}
          onClick={(e) => {
            if (suppressNavForIdRef.current === shortcut.id) {
              e.preventDefault();
              suppressNavForIdRef.current = null;
            }
          }}
        >
          {shortcut.label}
        </a>
      </DelayedHoverTooltip>
    </span>
  );
}

// --- Main App Component ---

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialAppState.sidebarCollapsed);
  const [focusMode, setFocusMode] = useState(initialAppState.focusMode);
  const [calendarReminders, setCalendarReminders] = useState(initialAppState.calendarReminders);
  const [monthViewDayNotes, setMonthViewDayNotes] = useState(initialAppState.monthViewDayNotes);
  const [studentNotes, setStudentNotes] = useState(initialAppState.studentNotes);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [selectedCalendarReminderId, setSelectedCalendarReminderId] = useState(null);
  const [calendarDraft, setCalendarDraft] = useState("");
  const [calendarTypeDraft, setCalendarTypeDraft] = useState("reminder");
  const [deleteId, setDeleteId] = useState(null);
  const [dismissedOverdueBadges, setDismissedOverdueBadges] = useState(() => new Set());
  const [viewMode, setViewMode] = useState(initialAppState.viewMode);
  const [selectedDay, setSelectedDay] = useState(initialAppState.selectedDay);
  const [selectedWeek, setSelectedWeek] = useState(initialAppState.selectedWeek);
  const [week1StartDate, setWeek1StartDate] = useState(initialAppState.week1StartDate);
  const [timerSeconds, setTimerSeconds] = useState(initialAppState.timerSeconds);
  const [editingTimer, setEditingTimer] = useState(initialAppState.editingTimer);
  const [timerInput, setTimerInput] = useState(initialAppState.timerInput);
  const [timerRunning, setTimerRunning] = useState(initialAppState.timerRunning);
  const [baseTimetable, setBaseTimetable] = useState(initialAppState.baseTimetable);
  const [weekLessonOverlays, setWeekLessonOverlays] = useState(initialAppState.weekLessonOverlays);

  const timetableDataRef = useRef({
    baseTimetable: initialAppState.baseTimetable,
    weekLessonOverlays: initialAppState.weekLessonOverlays,
    selectedWeek: initialAppState.selectedWeek,
  });
  timetableDataRef.current = { baseTimetable, weekLessonOverlays, selectedWeek };

  const applyTimetableUpdate = useCallback((updater) => {
    const { baseTimetable: b, weekLessonOverlays: wo, selectedWeek: sw } = timetableDataRef.current;
    const ov = { ...(wo[sw] ?? {}) };
    const merged = mergeBaseWithWeeklyOverlays(b, ov);
    const next = normalizeTimetableForStorage(updater(merged));
    setBaseTimetable(extractBaseTimetableFromMerged(next));
    setWeekLessonOverlays((prev) => ({ ...prev, [sw]: extractWeeklyOverlayFromMerged(next) }));
  }, []);

  const insertCellsAtAnchor = useCallback(
    ({ anchorDayName, anchorItemId, position, kind, targetDays }) => {
      const days = [...new Set((targetDays ?? []).filter((d) => TT_WEEKDAY_ORDER.includes(d)))];
      if (days.length === 0) return;
      applyTimetableUpdate((prev) => {
        const sourceDay = prev.find((d) => d.day === anchorDayName);
        if (!sourceDay) return prev;
        const idx = sourceDay.items.findIndex((i) => i.id === anchorItemId);
        if (idx === -1) return prev;
        const daySet = new Set(days);
        return prev.map((day) => {
          if (!daySet.has(day.day)) return day;
          const items = [...day.items];
          let insertAt = position === "above" ? idx : idx + 1;
          insertAt = Math.max(0, Math.min(insertAt, items.length));
          const newItem = kind === "duty" ? newDutySlot() : newLessonSlotForDay(day.day, day.items);
          items.splice(insertAt, 0, newItem);
          return { ...day, items };
        });
      });
    },
    [applyTimetableUpdate]
  );

  const removeCellsAtAnchor = useCallback(
    ({ anchorDayName, anchorItemId, targetDays }) => {
      const days = [...new Set((targetDays ?? []).filter((d) => TT_WEEKDAY_ORDER.includes(d)))];
      if (days.length === 0) return;
      applyTimetableUpdate((prev) => {
        const sourceDay = prev.find((d) => d.day === anchorDayName);
        if (!sourceDay) return prev;
        const idx = sourceDay.items.findIndex((i) => i.id === anchorItemId);
        if (idx === -1) return prev;
        const daySet = new Set(days);
        return prev.map((day) => {
          if (!daySet.has(day.day)) return day;
          const items = [...day.items];
          if (idx >= items.length) return day;
          items.splice(idx, 1);
          return { ...day, items };
        });
      });
    },
    [applyTimetableUpdate]
  );

  const timetable = useMemo(
    () =>
      normalizeTimetableForStorage(
        mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[selectedWeek] ?? {})
      ),
    [baseTimetable, weekLessonOverlays, selectedWeek]
  );

  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [unitPlannerOpen, setUnitPlannerOpen] = useState(false);
  const [viewUnitsOpen, setViewUnitsOpen] = useState(false);
  const [unitStore, setUnitStore] = useState(() =>
    typeof window !== "undefined" ? readUnitPlannerFromStorage() : { byClass: {} }
  );
  const [addLessonDraft, setAddLessonDraft] = useState(() =>
    defaultAddLessonDraft(initialAppState.selectedDay, initialAppState.timetable)
  );
  const [slotOverlayLessonId, setSlotOverlayLessonId] = useState(null);
  const [lessonReplaceConfirm, setLessonReplaceConfirm] = useState(null);
  const [dutyTimeApplyPrompt, setDutyTimeApplyPrompt] = useState(null);
  const [lastViewMode, setLastViewMode] = useState(initialAppState.lastViewMode);
  const [expandedLessons, setExpandedLessons] = useState(initialAppState.expandedLessons);
  const [expandedDays, setExpandedDays] = useState(initialAppState.expandedDays);

  useEffect(() => {
    setExpandedDays((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const d of timetable) {
        const ids = d.items.filter((i) => i.type === "lesson").map((l) => l.id);
        const v = ids.length > 0 && ids.every((id) => expandedLessons.includes(id));
        if (Boolean(next[d.day]) !== v) {
          next[d.day] = v;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [expandedLessons, timetable]);

  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [draggedItemInfo, setDraggedItemInfo] = useState(null);
  const [fontScale, setFontScale] = useState(initialAppState.fontScale);

  function bumpFontScale(delta) {
    setFontScale((s) => {
      const next = Number((s + delta).toFixed(1));
      return clampFontScale(next);
    });
  }

  const [searchQuery, setSearchQuery] = useState(initialAppState.searchQuery);
  const [calendarMonth, setCalendarMonth] = useState(initialAppState.calendarMonth);
  const [accentPicker, setAccentPicker] = useState(null);
  const accentPopoverRef = useRef(null);
  const [roomApplyPrompt, setRoomApplyPrompt] = useState(null);
  const roomApplyPopoverRef = useRef(null);
  const [subjectApplyPrompt, setSubjectApplyPrompt] = useState(null);
  const subjectApplyPopoverRef = useRef(null);
  const [weekToolsMenuOpen, setWeekToolsMenuOpen] = useState(false);
  const weekToolsMenuRef = useRef(null);
  const [utilitiesMenuOpen, setUtilitiesMenuOpen] = useState(false);
  const utilitiesMenuRef = useRef(null);
  const utilitiesBtnRef = useRef(null);
  const sidebarSearchInputRef = useRef(null);
  const sidebarUpcomingScrollRef = useRef(null);
  const [sidebarMoreBelow, setSidebarMoreBelow] = useState(false);
  const focusSidebarSearch = useCallback(() => {
    setSidebarCollapsed(false);
    window.requestAnimationFrame(() => {
      sidebarSearchInputRef.current?.focus();
    });
  }, []);
  const updateSidebarMoreBelow = useCallback(() => {
    const el = sidebarUpcomingScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setSidebarMoreBelow(scrollHeight > clientHeight + 2 && scrollTop < scrollHeight - clientHeight - 6);
  }, []);
  const scrollSidebarUpcomingDown = useCallback(() => {
    const el = sidebarUpcomingScrollRef.current;
    if (!el) return;
    const step = Math.min(180, el.scrollHeight - el.clientHeight - el.scrollTop);
    el.scrollBy({ top: Math.max(0, step), behavior: "smooth" });
  }, []);
  const weekClearDialogRef = useRef(null);
  /** { kind, mode, pick, weekScope: 'thisWeek'|'allWeeks' } */
  const [weekClearConfirm, setWeekClearConfirm] = useState(null);
  /** Duplicate current week timetable into another week's slot (confirm overwrite). */
  const [duplicateWeekDialog, setDuplicateWeekDialog] = useState(null);
  const duplicateWeekDialogRef = useRef(null);
  const [startNewTermModalOpen, setStartNewTermModalOpen] = useState(false);
  const [startNewTermChoice, setStartNewTermChoice] = useState("fresh");
  const [newTermReadyToast, setNewTermReadyToast] = useState(false);
  const [studentNoteEntryDialog, setStudentNoteEntryDialog] = useState(null);
  const [studentNoteStudentDraft, setStudentNoteStudentDraft] = useState("");
  const [studentNoteQuickChoiceDraft, setStudentNoteQuickChoiceDraft] = useState("");
  const [studentNoteTextDraft, setStudentNoteTextDraft] = useState("");
  const [studentNotesViewerOpen, setStudentNotesViewerOpen] = useState(false);
  const [studentNotesViewerScope, setStudentNotesViewerScope] = useState("individual");
  const [studentNotesSearch, setStudentNotesSearch] = useState("");
  const [studentNotesClassFilter, setStudentNotesClassFilter] = useState("");
  const [weekDateLockDialogOpen, setWeekDateLockDialogOpen] = useState(false);
  const [weekDateLockWeek, setWeekDateLockWeek] = useState(initialAppState.selectedWeek);
  const [weekDateLockMondayIso, setWeekDateLockMondayIso] = useState(isoDateFromLocalDate(schoolWeekMonday(new Date())));
  const [lessonExportDialogOpen, setLessonExportDialogOpen] = useState(false);
  const [lessonExportScope, setLessonExportScope] = useState("week");
  const [lessonExportDay, setLessonExportDay] = useState("Monday");
  const [lessonExportLessonId, setLessonExportLessonId] = useState("");
  const [lessonExportFeedback, setLessonExportFeedback] = useState("");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveDraftLabel, setArchiveDraftLabel] = useState("");
  const [archiveSaveConfirm, setArchiveSaveConfirm] = useState(false);
  const [teacherStudioArchives, setTeacherStudioArchives] = useState(() => readTeacherStudioArchives());
  const [archiveRestoreConfirm, setArchiveRestoreConfirm] = useState(null);
  const [utilityExportModalOpen, setUtilityExportModalOpen] = useState(false);
  const [utilityImportModalOpen, setUtilityImportModalOpen] = useState(false);
  const [utilityImportReplaceConfirm, setUtilityImportReplaceConfirm] = useState(null);
  const [sidebarUpcomingAllOpen, setSidebarUpcomingAllOpen] = useState(false);
  const utilityImportInputRef = useRef(null);
  const [toolShortcuts, setToolShortcuts] = useState(initialAppState.toolShortcuts);
  const [dayCountdownTarget, setDayCountdownTarget] = useState(initialAppState.dayCountdownTarget);
  const [dayCountdownEventLabel, setDayCountdownEventLabel] = useState(initialAppState.dayCountdownEventLabel);
  const [editingDayCountdown, setEditingDayCountdown] = useState(false);
  const [dayCountdownDraft, setDayCountdownDraft] = useState("");
  const [celebrations, setCelebrations] = useState(initialAppState.celebrations);
  const [celebrationsAnchor, setCelebrationsAnchor] = useState(null);
  const celebrationPopoverRef = useRef(null);
  const [bellReminderSettings, setBellReminderSettings] = useState(initialAppState.bellReminderSettings);
  const [bellReminderAnchor, setBellReminderAnchor] = useState(null);
  const bellPopoverRef = useRef(null);
  const [bellReminderToast, setBellReminderToast] = useState(null);
  const bellSettingsRef = useRef(initialAppState.bellReminderSettings);
  const bellFiredRef = useRef({ day: "", keys: new Set() });
  bellSettingsRef.current = bellReminderSettings;
  const [dashboardToolsMenu, setDashboardToolsMenu] = useState(null);
  const [dashboardToolsView, setDashboardToolsView] = useState("menu");
  const [shortcutDraftLabel, setShortcutDraftLabel] = useState("");
  const [shortcutDraftHref, setShortcutDraftHref] = useState("");
  const [editingShortcutId, setEditingShortcutId] = useState(null);
  const dashboardToolsRef = useRef(null);
  const [calcPopoverAnchor, setCalcPopoverAnchor] = useState(null);
  const calcPopoverRef = useRef(null);
  const [shortcutActionMenu, setShortcutActionMenu] = useState(null);
  const shortcutActionMenuRef = useRef(null);
  const suppressShortcutLinkNavRef = useRef(null);
  const shortcutFlyoutCloseTimerRef = useRef(null);

  function cancelShortcutFlyoutClose() {
    if (shortcutFlyoutCloseTimerRef.current) {
      window.clearTimeout(shortcutFlyoutCloseTimerRef.current);
      shortcutFlyoutCloseTimerRef.current = null;
    }
  }

  function scheduleShortcutFlyoutClose(shortcutId) {
    cancelShortcutFlyoutClose();
    shortcutFlyoutCloseTimerRef.current = window.setTimeout(() => {
      setShortcutActionMenu((m) => (m?.shortcut.id === shortcutId ? null : m));
      shortcutFlyoutCloseTimerRef.current = null;
    }, 200);
  }

  function openShortcutFlyout(shortcut, anchor) {
    cancelShortcutFlyoutClose();
    setShortcutActionMenu({ shortcut, anchor });
  }

  const formattedTimer = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;
  const daysUntilTarget = useMemo(
    () => daysBetweenTodayAndIso(dayCountdownTarget),
    [dayCountdownTarget]
  );

  const upcomingItems = useMemo(() => {
    const cal = calendarReminders.map((item) => ({
      ...item,
      status: getReminderStatus(Number(item.date), Number(item.month), Number(item.year)),
      dayName: getDayNameFromDate(item.date, item.month, item.year),
      sortValue: new Date(item.year, item.month, item.date).getTime(),
    }));
    const cel = celebrations.map((c) => {
      const occ = getCelebrationOccurrence(c.date, c.yearly !== false);
      if (!occ) return null;
      const { year: y, month: monthIndex, date: d, sortValue } = occ;
      return {
        id: c.id,
        date: d,
        month: monthIndex,
        year: y,
        title: c.name.trim() || "Celebration",
        kind: "celebration",
        celebrationYearly: c.yearly !== false,
        status: getReminderStatus(Number(d), Number(monthIndex), Number(y)),
        dayName: getDayNameFromDate(d, monthIndex, y),
        sortValue,
      };
    });
    return [...cal, ...cel.filter(Boolean)].sort((a, b) => a.sortValue - b.sortValue);
  }, [calendarReminders, celebrations]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUpcomingItems = useMemo(
    () =>
      !normalizedSearch
        ? upcomingItems
        : upcomingItems.filter((item) =>
            [item.title, item.kind, item.dayName, `${item.date}`, item.celebrationYearly ? "yearly" : ""]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch)
          ),
    [upcomingItems, normalizedSearch]
  );

  useEffect(() => {
    const overdueIds = new Set(
      upcomingItems.filter((item) => item.kind !== "celebration" && item.status === "overdue").map((item) => item.id)
    );
    setDismissedOverdueBadges((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (overdueIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [upcomingItems]);

  useLayoutEffect(() => {
    updateSidebarMoreBelow();
  }, [filteredUpcomingItems, sidebarCollapsed, updateSidebarMoreBelow]);

  useEffect(() => {
    if (focusMode) return;
    const el = sidebarUpcomingScrollRef.current;
    if (!el) return;
    const onScroll = () => updateSidebarMoreBelow();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateSidebarMoreBelow());
    ro.observe(el);
    updateSidebarMoreBelow();
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [focusMode, updateSidebarMoreBelow]);

  useEffect(() => {
    if (!sidebarUpcomingAllOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarUpcomingAllOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarUpcomingAllOpen]);

  const filteredTimetable = useMemo(() => {
    if (!normalizedSearch) return timetable;

    return timetable
      .map((day) => {
        const matchingItems = day.items.filter((item) => {
          if (item.type === 'lesson') {
            return [
              day.day,
              item.period,
              item.subject,
              item.classGroup,
              item.room,
              item.note,
              item.lineNote,
              item.time,
              item.lessonPlan ? JSON.stringify(item.lessonPlan) : "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
          } else {
            return [day.day, item.label, item.time]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
          }
        });

        return { ...day, items: matchingItems };
      })
      .filter((day) => day.items.length > 0);
  }, [timetable, normalizedSearch]);

  const timetableForView = normalizedSearch ? filteredTimetable : timetable;
  const visibleDays =
    viewMode === "week"
      ? timetableForView
      : viewMode === "day"
        ? timetableForView.filter((d) => d.day === selectedDay)
        : [];
  const expandScopeDays = viewMode === "month" ? timetableForView : visibleDays;

  const timetableClassLabels = useMemo(() => collectTimetableClassLabels(timetable), [timetable]);

  const viewUnitClassOptions = useMemo(() => {
    const fromTimetable = collectTimetableClassLabels(timetable);
    const fromStore = Object.keys(unitStore.byClass || {}).filter(
      (k) => (unitStore.byClass[k] ?? []).length > 0
    );
    return [...new Set([...fromTimetable, ...fromStore])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [timetable, unitStore]);

  const lessonExportDayOptions = useMemo(
    () =>
      TT_WEEKDAY_ORDER.map((day) => {
        const dayRow = timetable.find((d) => d.day === day);
        const lessons = (dayRow?.items ?? []).filter((item) => item.type === "lesson");
        return { day, lessons };
      }),
    [timetable]
  );

  const lessonExportLessonOptions = useMemo(() => {
    const row = lessonExportDayOptions.find((d) => d.day === lessonExportDay);
    return row?.lessons ?? [];
  }, [lessonExportDayOptions, lessonExportDay]);

  const selectedWeekDateLabelsByDay = useMemo(() => {
    const out = {};
    for (const day of TT_WEEKDAY_ORDER) {
      const d = weekDayDateFor(week1StartDate, selectedWeek, day);
      out[day] = d
        ? `${d.getDate()} ${d.toLocaleDateString("en-AU", { month: "short" })}`
        : "";
    }
    return out;
  }, [week1StartDate, selectedWeek]);

  const studentNoteClassOptions = useMemo(() => {
    const set = new Set();
    for (const n of studentNotes) {
      const label = String(n.classLabel ?? "").trim();
      if (label) set.add(label);
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [studentNotes]);

  const filteredStudentNotes = useMemo(() => {
    const q = studentNotesSearch.trim().toLowerCase();
    return studentNotes.filter((n) => {
      if (studentNotesViewerScope === "class" && studentNotesClassFilter) {
        if (n.classLabel !== studentNotesClassFilter) return false;
      }
      if (!q) return true;
      const blob = `${n.studentName} ${n.classLabel} ${n.note} ${n.week} ${n.day} ${n.period}`.toLowerCase();
      return blob.includes(q);
    });
  }, [studentNotes, studentNotesSearch, studentNotesViewerScope, studentNotesClassFilter]);

  useEffect(() => {
    setBaseTimetable((prev) =>
      stripWeeklyFieldsFromBaseTimetable(stripWednesdayLessonsToTemplatePeriods(prev))
    );
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (
      !addLessonOpen &&
      !lessonReplaceConfirm &&
      !dutyTimeApplyPrompt &&
      !slotOverlayLessonId &&
      !unitPlannerOpen &&
      !viewUnitsOpen
    )
      return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (lessonReplaceConfirm) {
        setLessonReplaceConfirm(null);
        return;
      }
      if (dutyTimeApplyPrompt) {
        setDutyTimeApplyPrompt(null);
        return;
      }
      if (slotOverlayLessonId) {
        setSlotOverlayLessonId(null);
        return;
      }
      if (unitPlannerOpen) {
        setUnitPlannerOpen(false);
        return;
      }
      if (viewUnitsOpen) {
        setViewUnitsOpen(false);
        return;
      }
      if (addLessonOpen) setAddLessonOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addLessonOpen, lessonReplaceConfirm, dutyTimeApplyPrompt, slotOverlayLessonId, unitPlannerOpen, viewUnitsOpen]);

  useEffect(() => {
    if (!archiveModalOpen && !archiveRestoreConfirm) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (archiveRestoreConfirm) {
        setArchiveRestoreConfirm(null);
        return;
      }
      setArchiveModalOpen(false);
      setArchiveSaveConfirm(false);
      setArchiveDraftLabel("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [archiveModalOpen, archiveRestoreConfirm]);

  useEffect(() => {
    if (!utilityExportModalOpen && !utilityImportModalOpen && !utilityImportReplaceConfirm) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (utilityImportReplaceConfirm) {
        setUtilityImportReplaceConfirm(null);
        return;
      }
      setUtilityExportModalOpen(false);
      setUtilityImportModalOpen(false);
      if (utilityImportInputRef.current) utilityImportInputRef.current.value = "";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [utilityExportModalOpen, utilityImportModalOpen, utilityImportReplaceConfirm]);

  useEffect(() => {
    if (!studentNoteEntryDialog && !studentNotesViewerOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (studentNoteEntryDialog) {
        closeStudentNoteEntryDialog();
        return;
      }
      setStudentNotesViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [studentNoteEntryDialog, studentNotesViewerOpen]);

  useEffect(() => {
    if (!lessonExportDialogOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setLessonExportDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lessonExportDialogOpen]);

  useEffect(() => {
    if (!weekDateLockDialogOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setWeekDateLockDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weekDateLockDialogOpen]);

  useEffect(() => {
    if (!lessonExportDayOptions.some((d) => d.day === lessonExportDay)) {
      setLessonExportDay(TT_WEEKDAY_ORDER[0] ?? "Monday");
    }
  }, [lessonExportDayOptions, lessonExportDay]);

  useEffect(() => {
    if (lessonExportScope !== "lesson") return;
    if (lessonExportLessonOptions.some((l) => l.id === lessonExportLessonId)) return;
    setLessonExportLessonId(lessonExportLessonOptions[0]?.id ?? "");
  }, [lessonExportScope, lessonExportLessonOptions, lessonExportLessonId]);

  useEffect(() => {
    if (!accentPicker) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAccentPicker(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accentPicker]);

  useEffect(() => {
    if (!accentPicker) return;
    const onPointerDown = (e) => {
      if (accentPopoverRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-lesson-accent-hit]")) return;
      setAccentPicker(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [accentPicker]);

  useEffect(() => {
    if (!roomApplyPrompt) return;
    const onKey = (e) => {
      if (e.key === "Escape") setRoomApplyPrompt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roomApplyPrompt]);

  useEffect(() => {
    if (!roomApplyPrompt) return;
    const onPointerDown = (e) => {
      if (roomApplyPopoverRef.current?.contains(e.target)) return;
      setRoomApplyPrompt(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [roomApplyPrompt]);

  useEffect(() => {
    if (!subjectApplyPrompt) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSubjectApplyPrompt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subjectApplyPrompt]);

  useEffect(() => {
    if (!subjectApplyPrompt) return;
    const onPointerDown = (e) => {
      if (subjectApplyPopoverRef.current?.contains(e.target)) return;
      setSubjectApplyPrompt(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [subjectApplyPrompt]);

  useEffect(() => {
    if (studentNotesViewerScope !== "class") return;
    if (studentNoteClassOptions.length === 0) {
      if (studentNotesClassFilter) setStudentNotesClassFilter("");
      return;
    }
    if (!studentNoteClassOptions.includes(studentNotesClassFilter)) {
      setStudentNotesClassFilter(studentNoteClassOptions[0]);
    }
  }, [studentNotesViewerScope, studentNoteClassOptions, studentNotesClassFilter]);

  useEffect(() => {
    if (!weekToolsMenuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeWeekToolsMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weekToolsMenuOpen]);

  useEffect(() => {
    if (!weekToolsMenuOpen) return;
    const onPointerDown = (e) => {
      if (weekToolsMenuRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-week-tools-trigger]")) return;
      if (e.target.closest?.("[data-utilities-trigger]")) return;
      closeWeekToolsMenu();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [weekToolsMenuOpen]);

  useEffect(() => {
    if (!utilitiesMenuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeUtilitiesMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [utilitiesMenuOpen]);

  useEffect(() => {
    if (!utilitiesMenuOpen) return;
    const onPointerDown = (e) => {
      if (utilitiesMenuRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-utilities-trigger]")) return;
      closeUtilitiesMenu();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [utilitiesMenuOpen]);

  useEffect(() => {
    if (!weekClearConfirm) return;
    const onKey = (e) => {
      if (e.key === "Escape") cancelWeekClear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weekClearConfirm]);

  useEffect(() => {
    if (!weekClearConfirm) return;
    const onPointerDown = (e) => {
      if (weekClearDialogRef.current?.contains(e.target)) return;
      cancelWeekClear();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [weekClearConfirm]);

  useEffect(() => {
    if (!duplicateWeekDialog) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDuplicateWeekDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duplicateWeekDialog]);

  useEffect(() => {
    if (!duplicateWeekDialog) return;
    const onPointerDown = (e) => {
      if (duplicateWeekDialogRef.current?.contains(e.target)) return;
      setDuplicateWeekDialog(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [duplicateWeekDialog]);

  useEffect(() => {
    if (!dashboardToolsMenu && !calcPopoverAnchor && !shortcutActionMenu && !celebrationsAnchor && !bellReminderAnchor)
      return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        cancelShortcutFlyoutClose();
        setDashboardToolsMenu(null);
        setCalcPopoverAnchor(null);
        setCelebrationsAnchor(null);
        setBellReminderAnchor(null);
        setDashboardToolsView("menu");
        setShortcutActionMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dashboardToolsMenu, calcPopoverAnchor, shortcutActionMenu, celebrationsAnchor, bellReminderAnchor]);

  useEffect(() => {
    if (!dashboardToolsMenu && !calcPopoverAnchor && !celebrationsAnchor && !bellReminderAnchor) return;
    const onPointerDown = (e) => {
      if (dashboardToolsRef.current?.contains(e.target)) return;
      if (calcPopoverRef.current?.contains(e.target)) return;
      if (celebrationPopoverRef.current?.contains(e.target)) return;
      if (bellPopoverRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-dashboard-tools-trigger]")) return;
      if (e.target.closest?.("[data-dashboard-calc-trigger]")) return;
      if (e.target.closest?.("[data-dashboard-celebrations-trigger]")) return;
      if (e.target.closest?.("[data-dashboard-bell-trigger]")) return;
      cancelShortcutFlyoutClose();
      setDashboardToolsMenu(null);
      setCalcPopoverAnchor(null);
      setCelebrationsAnchor(null);
      setBellReminderAnchor(null);
      setDashboardToolsView("menu");
      setShortcutActionMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [dashboardToolsMenu, calcPopoverAnchor, celebrationsAnchor, bellReminderAnchor]);

  useEffect(() => {
    bellFiredRef.current.keys.clear();
  }, [
    bellReminderSettings.periodEndTimes.join("|"),
    bellReminderSettings.dutyTimes.map((x) => `${x.day}|${x.time}`).join("||"),
    bellReminderSettings.enabled,
  ]);

  useEffect(() => {
    if (!bellReminderSettings.enabled) return;
    const ensureDay = () => {
      const d = todayIsoDate();
      if (bellFiredRef.current.day !== d) {
        bellFiredRef.current = { day: d, keys: new Set() };
      }
    };
    const tick = () => {
      const s = bellSettingsRef.current;
      if (!s.enabled) return;
      ensureDay();
      const now = Date.now();
      const fired = bellFiredRef.current.keys;
      const maybeFire = (key, hm, message) => {
        if (!/^\d{2}:\d{2}$/.test(hm)) return;
        if (fired.has(key)) return;
        const target = localTodayAtTimeHm(hm);
        if (target == null || target <= now) return;
        const msUntil = target - now;
        if (msUntil > 4 * 60 * 1000 && msUntil <= 5 * 60 * 1000) {
          fired.add(key);
          setBellReminderToast({ text: message });
          if (s.soundEnabled) playBellReminderChime();
        }
      };
      for (const hm of s.periodEndTimes) maybeFire(`p-${hm}`, hm, "5 mins to bell");
      const todayW = bellReminderTodayWeekdayName();
      for (const slot of s.dutyTimes) {
        if (!slot || typeof slot !== "object") continue;
        if (slot.day !== todayW) continue;
        const hm = slot.time;
        if (typeof hm !== "string") continue;
        maybeFire(`d-${slot.day}-${hm}`, hm, "Duty in 5 mins");
      }
    };
    const id = window.setInterval(tick, 20000);
    tick();
    return () => window.clearInterval(id);
  }, [bellReminderSettings.enabled]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("teacher-studio-new-term-ready")) {
        sessionStorage.removeItem("teacher-studio-new-term-ready");
        setNewTermReadyToast(true);
        const t = window.setTimeout(() => setNewTermReadyToast(false), 4000);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!shortcutActionMenu) return;
    const onPointerDown = (e) => {
      if (shortcutActionMenuRef.current?.contains(e.target)) return;
      cancelShortcutFlyoutClose();
      setShortcutActionMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [shortcutActionMenu]);

  function removeToolShortcut(id) {
    cancelShortcutFlyoutClose();
    setToolShortcuts((prev) => prev.filter((s) => s.id !== id));
    if (editingShortcutId === id) {
      setEditingShortcutId(null);
      setShortcutDraftLabel("");
      setShortcutDraftHref("");
    }
    setShortcutActionMenu(null);
  }

  function openShortcutEdit(shortcut, rect) {
    cancelShortcutFlyoutClose();
    setShortcutActionMenu(null);
    setCalcPopoverAnchor(null);
    setBellReminderAnchor(null);
    setEditingShortcutId(shortcut.id);
    setShortcutDraftLabel(shortcut.label);
    setShortcutDraftHref(shortcut.href);
    setDashboardToolsMenu({
      left: rect.left,
      top: rect.top,
      width: Math.max(rect.width, 120),
      height: rect.height,
    });
    setDashboardToolsView("add");
  }

  function saveShortcutForm() {
    const href = parseShortcutHref(shortcutDraftHref);
    if (!shortcutDraftLabel.trim() || !href) return;
    if (editingShortcutId) {
      setToolShortcuts((prev) =>
        prev.map((s) =>
          s.id === editingShortcutId ? { ...s, label: shortcutDraftLabel.trim(), href } : s
        )
      );
    } else {
      setToolShortcuts((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, label: shortcutDraftLabel.trim(), href },
      ]);
    }
    setEditingShortcutId(null);
    setShortcutDraftLabel("");
    setShortcutDraftHref("");
    setDashboardToolsView("menu");
    setDashboardToolsMenu(null);
  }

  function cancelShortcutForm() {
    setEditingShortcutId(null);
    setShortcutDraftLabel("");
    setShortcutDraftHref("");
    setDashboardToolsView("menu");
  }

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem("teacher-studio-new-term-ready")) {
        return;
      }
    } catch {
      /* ignore */
    }
    const payload = {
      v: 1,
      sidebarCollapsed,
      focusMode,
      calendarReminders,
      viewMode,
      selectedDay,
      selectedWeek,
      week1StartDate,
      timerSeconds,
      editingTimer,
      timerInput,
      timerRunning,
      timetable,
      baseTimetable,
      weekLessonOverlays,
      lastViewMode,
      expandedLessons,
      expandedDays,
      fontScale,
      searchQuery,
      calendarMonth,
      toolShortcuts,
      dayCountdownTarget,
      dayCountdownEventLabel,
      celebrations,
      bellReminderSettings: normalizeBellReminderSettings(bellReminderSettings),
      monthViewDayNotes,
      studentNotes,
    };
    try {
      window.localStorage.setItem(TEACHER_STUDIO_STORAGE_KEY, JSON.stringify(payload));
      window.localStorage.setItem(TEACHER_STUDIO_FONT_STORAGE_KEY, String(fontScale));
    } catch {
      /* quota / private mode */
    }
  }, [
    sidebarCollapsed,
    focusMode,
    calendarReminders,
    viewMode,
    selectedDay,
    selectedWeek,
    week1StartDate,
    timerSeconds,
    editingTimer,
    timerInput,
    timerRunning,
    timetable,
    baseTimetable,
    weekLessonOverlays,
    lastViewMode,
    expandedLessons,
    expandedDays,
    fontScale,
    searchQuery,
    calendarMonth,
    toolShortcuts,
    dayCountdownTarget,
    dayCountdownEventLabel,
    celebrations,
    bellReminderSettings,
    monthViewDayNotes,
    studentNotes,
  ]);

  const handleMonthViewDayNoteCommit = useCallback((noteKey, text) => {
    const trimmed = text.trim().slice(0, 2000);
    setMonthViewDayNotes((prev) => {
      const next = { ...prev };
      if (!trimmed) delete next[noteKey];
      else next[noteKey] = trimmed;
      return next;
    });
  }, []);

  function openSlotLessonOverlay(lesson) {
    const matchedDay = timetable.find((day) => day.items.some((entry) => entry.id === lesson.id));
    if (matchedDay) {
      setSelectedDay(matchedDay.day);
    }
    setSlotOverlayLessonId(lesson.id);
  }

  function closeSlotLessonOverlay() {
    setSlotOverlayLessonId(null);
  }

  function saveSlotOverlayLesson(lessonId, patch) {
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === lessonId && item.type === "lesson" ? { ...item, ...patch } : item
        ),
      }))
    );
    closeSlotLessonOverlay();
  }

  function commitLessonLineNote(lessonId, text) {
    const v = text.trim();
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          if (item.id !== lessonId || item.type !== "lesson") return item;
          if (!v) {
            const next = { ...item };
            delete next.lineNote;
            return next;
          }
          return { ...item, lineNote: v };
        }),
      }))
    );
  }

  function commitLessonSlotNote(lessonId, text) {
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === lessonId && item.type === "lesson" ? { ...item, note: text } : item
        ),
      }))
    );
  }

  function commitLessonHeaderLabel(lessonId, text) {
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === lessonId && item.type === "lesson"
            ? { ...item, subject: text, classGroup: "" }
            : item
        ),
      }))
    );
  }

  function applySubjectToAllLessonsWithKey(oldSubject, newSubject) {
    const key = lessonSubjectKey(oldSubject);
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.type === "lesson" && lessonSubjectKey(item.subject) === key
            ? { ...item, subject: newSubject, classGroup: "" }
            : item
        ),
      }))
    );
  }

  /** Returns true if a picker was opened (caller should skip duplicate blur handling). */
  function onLessonHeaderCommitAttempt(lessonId, newSubjectRaw, opts = {}) {
    const lesson = findLessonInTimetable(timetable, lessonId);
    if (!lesson) return false;
    const trimmed = String(newSubjectRaw ?? "").trim();
    const nextVal = trimmed || "—";
    const prevVal = (lesson.subject ?? "").trim() || "—";
    if (prevVal === nextVal) return false;

    const openPicker = Boolean(opts?.openPicker);
    if (openPicker && lessonSubjectKey(nextVal) !== lessonSubjectKey(lesson.subject)) {
      setSubjectApplyPrompt({ lessonId, oldSubject: lesson.subject, newSubject: nextVal });
      return true;
    }
    commitLessonHeaderLabel(lessonId, nextVal);
    return false;
  }

  function applyLessonDraftToSlot(draft) {
    const payload = buildSlotLessonPlanPayload(draft);
    applyTimetableUpdate((prev) =>
      prev.map((day) => {
        if (day.day !== draft.day) return day;
        return {
          ...day,
          items: day.items.map((item) => {
            if (item.type !== "lesson" || item.period !== draft.period) return item;
            const merged = { ...item, ...payload, id: item.id, period: item.period };
            const prevRoom = (item.room ?? "").trim();
            if (!draft.room.trim() && prevRoom) merged.room = prevRoom;
            return merged;
          }),
        };
      })
    );
  }

  function openAccentPicker(lessonId, anchorRect) {
    setAccentPicker((prev) => {
      if (prev?.lessonId === lessonId && prev.step === "palette") {
        return null;
      }
      let found = null;
      for (const day of timetable) {
        const item = day.items.find((i) => i.id === lessonId && i.type === "lesson");
        if (item) {
          found = item;
          break;
        }
      }
      if (!found) return prev;
      return {
        lessonId,
        subject: found.subject ?? "",
        step: "palette",
        pendingAccent: null,
        anchor: anchorRect ?? null,
      };
    });
  }

  function applyAccentToLessonId(lessonId, accentId) {
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          if (item.id !== lessonId || item.type !== "lesson") return item;
          if (accentId == null) {
            const next = { ...item };
            delete next.accent;
            return next;
          }
          return { ...item, accent: accentId };
        }),
      }))
    );
  }

  function applyAccentToAllLessonsWithSubject(subject, accentId) {
    const key = lessonSubjectKey(subject);
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          if (item.type !== "lesson" || lessonSubjectKey(item.subject) !== key) return item;
          if (accentId == null) {
            const next = { ...item };
            delete next.accent;
            return next;
          }
          return { ...item, accent: accentId };
        }),
      }))
    );
  }

  function applyRoomToLessonId(lessonId, room) {
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === lessonId && item.type === "lesson" ? { ...item, room } : item
        ),
      }))
    );
  }

  function applyRoomToAllLessonsWithSubject(subject, room) {
    const key = lessonSubjectKey(subject);
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.type === "lesson" && lessonSubjectKey(item.subject) === key
            ? { ...item, room }
            : item
        ),
      }))
    );
  }

  function applyRoomToLessonIds(lessonIds, room) {
    const idSet = new Set(lessonIds);
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.type === "lesson" && idSet.has(item.id) ? { ...item, room } : item
        ),
      }))
    );
  }

  function applySubjectToLessonIds(lessonIds, newSubject) {
    const idSet = new Set(lessonIds);
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.type === "lesson" && idSet.has(item.id)
            ? { ...item, subject: newSubject, classGroup: "" }
            : item
        ),
      }))
    );
  }

  function handleAccentPaletteChoice(accentId) {
    if (!accentPicker || accentPicker.step !== "palette") return;
    const n = countLessonsMatchingSubject(timetable, accentPicker.subject);
    if (n <= 1) {
      applyAccentToLessonId(accentPicker.lessonId, accentId);
      setAccentPicker(null);
      return;
    }
    setAccentPicker((p) =>
      p ? { ...p, step: "confirm", pendingAccent: accentId } : null
    );
  }

  function closeAccentPicker() {
    setAccentPicker(null);
  }

  function handleAddLesson() {
    const day = timetable.find((entry) => entry.day === selectedDay);
    if (!day) return;
    setAddLessonDraft(defaultAddLessonDraft(selectedDay, timetable));
    setAddLessonOpen(true);
  }

  function handleSaveUnitPlannerEntry({ classLabel, unitTitle, lessonFocuses }) {
    const entry = {
      id: newUnitPlannerId(),
      unitTitle,
      lessonFocuses,
      savedAt: new Date().toISOString(),
    };
    setUnitStore((prev) => {
      const list = [...(prev.byClass[classLabel] ?? []), entry];
      const next = { byClass: { ...prev.byClass, [classLabel]: list } };
      writeUnitPlannerToStorage(next);
      return next;
    });
    setUnitPlannerOpen(false);
  }

  function closeAddLessonForm() {
    setAddLessonOpen(false);
  }

  function submitAddLessonForm() {
    const day = timetable.find((entry) => entry.day === addLessonDraft.day);
    if (!day) {
      setAddLessonOpen(false);
      return;
    }
    const slot = day.items.find((i) => i.type === "lesson" && i.period === addLessonDraft.period);
    if (!slot) {
      setAddLessonOpen(false);
      return;
    }
    if (lessonSlotHasPlan(slot)) {
      setLessonReplaceConfirm({ draft: { ...addLessonDraft } });
      return;
    }
    applyLessonDraftToSlot(addLessonDraft);
    setAddLessonOpen(false);
    setAddLessonDraft(defaultAddLessonDraft(selectedDay, timetable));
  }

  function confirmLessonReplace() {
    if (!lessonReplaceConfirm?.draft) return;
    applyLessonDraftToSlot(lessonReplaceConfirm.draft);
    setLessonReplaceConfirm(null);
    setAddLessonOpen(false);
    setAddLessonDraft(defaultAddLessonDraft(selectedDay, timetable));
  }

  function cancelLessonReplace() {
    setLessonReplaceConfirm(null);
  }

  function firstDateForWeekdayInMonth(year, monthZeroBased, weekdayName) {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const target = names.indexOf(weekdayName);
    if (target < 0) return null;
    const dim = new Date(year, monthZeroBased + 1, 0).getDate();
    for (let d = 1; d <= dim; d += 1) {
      if (new Date(year, monthZeroBased, d).getDay() === target) return d;
    }
    return null;
  }

  function openCalendarFromLessonSlot(dayName, kind, suggestedTitle = "") {
    const resolvedDate = weekDayDateFor(week1StartDate, selectedWeek, dayName);
    const y = resolvedDate?.getFullYear() ?? calendarMonth.year;
    const m = resolvedDate?.getMonth() ?? calendarMonth.month;
    let date = resolvedDate?.getDate();
    if (!Number.isFinite(date)) {
      date = firstDateForWeekdayInMonth(y, m, dayName);
      if (date == null) date = 1;
    }
    setCalendarMonth({ year: y, month: m });
    setSelectedCalendarDate(date);
    setSelectedCalendarReminderId(null);
    setCalendarTypeDraft(kind);
    setCalendarDraft(suggestedTitle.trim());
  }

  function openAddLessonForSlot(dayName, period) {
    const base = defaultAddLessonDraft(dayName, timetable);
    setAddLessonDraft({ ...base, day: dayName, period });
    setAddLessonOpen(true);
    setSelectedDay(dayName);
  }

  function openCalendarReminder(date, reminder = null) {
    setSelectedCalendarDate(date);
    setSelectedCalendarReminderId(reminder?.id || null);
    setCalendarDraft(reminder?.title || "");
    setCalendarTypeDraft(reminder?.kind || "reminder");
  }

  function goToPreviousMonth() {
    setCalendarMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }

  function goToNextMonth() {
    setCalendarMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }

  function closeCalendarReminder() {
    setSelectedCalendarDate(null);
    setSelectedCalendarReminderId(null);
    setCalendarDraft("");
    setCalendarTypeDraft("reminder");
  }

  function saveCalendarReminder() {
    if (!selectedCalendarDate) return;
    const trimmed = calendarDraft.trim();
    if (!trimmed) {
      closeCalendarReminder();
      return;
    }

    setCalendarReminders((prev) => {
      if (selectedCalendarReminderId) {
        return prev.map((reminder) =>
          reminder.id === selectedCalendarReminderId
            ? { ...reminder, title: trimmed, date: selectedCalendarDate, month: calendarMonth.month, year: calendarMonth.year, kind: calendarTypeDraft }
            : reminder
        );
      }

      return [
        ...prev,
        {
          id: `cal-${Date.now()}`,
          date: selectedCalendarDate,
          month: calendarMonth.month,
          year: calendarMonth.year,
          title: trimmed,
          kind: calendarTypeDraft,
        },
      ];
    });

    closeCalendarReminder();
  }

  function handleFillDay(dayName) {
    setSelectedDay(dayName);
    setViewMode("day");
  }

  function toggleFocusMode() {
    setFocusMode((prev) => {
      const next = !prev;
      if (!prev) {
        const allLessonIds = timetable.flatMap((day) => day.items.filter(i => i.type === 'lesson').map((lesson) => lesson.id));
        setExpandedLessons(allLessonIds);
        setExpandedDays(Object.fromEntries(timetable.map((day) => [day.day, true])));
      }
      return next;
    });
  }

  function handleTimerToggle() {
    if (timerSeconds === 0) setTimerSeconds(12 * 60);
    setTimerRunning((prev) => !prev);
  }

  function handleTimerEditStart() {
    setEditingTimer(true);
    setTimerInput(formattedTimer);
  }

  function handleTimerEditSave() {
    const parts = timerInput.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!isNaN(mins) && !isNaN(secs)) {
        setTimerSeconds(mins * 60 + secs);
      }
    }
    setEditingTimer(false);
  }

  function handleTimerReset() {
    setTimerRunning(false);
    setTimerSeconds(12 * 60);
  }

  function toggleLessonExpand(lessonId) {
    setExpandedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  }

  function toggleDayExpanded(dayName) {
    const day = timetable.find((entry) => entry.day === dayName);
    if (!day) return;

    const dayLessonIds = day.items.filter(i => i.type === 'lesson').map((lesson) => lesson.id);
    const isExpanded = dayLessonIds.every((id) => expandedLessons.includes(id));

    setExpandedLessons((prev) => {
      const filtered = prev.filter((id) => !dayLessonIds.includes(id));
      return isExpanded ? filtered : [...filtered, ...dayLessonIds];
    });

    setExpandedDays((prev) => ({
      ...prev,
      [dayName]: !isExpanded,
    }));
  }

  function handleExpandAll() {
    const visibleLessonIds = expandScopeDays.flatMap((day) =>
      day.items.filter((i) => i.type === "lesson").map((lesson) => lesson.id)
    );
    const allExpanded = visibleLessonIds.every((id) => expandedLessons.includes(id));

    setExpandedLessons((prev) => {
      const filtered = prev.filter((id) => !visibleLessonIds.includes(id));
      return allExpanded ? filtered : [...filtered, ...visibleLessonIds];
    });

    setExpandedDays((prev) => {
      const next = { ...prev };
      expandScopeDays.forEach((day) => {
        next[day.day] = !allExpanded;
      });
      return next;
    });
  }

  function closeWeekToolsMenu() {
    setWeekToolsMenuOpen(false);
  }

  function closeUtilitiesMenu() {
    setUtilitiesMenuOpen(false);
  }

  function toggleUtilitiesMenu(e) {
    e.stopPropagation();
    if (utilitiesMenuOpen) {
      closeUtilitiesMenu();
      return;
    }
    closeWeekToolsMenu();
    setUtilitiesMenuOpen(true);
  }

  function openNewWeekSubmenuFromUtilities() {
    closeUtilitiesMenu();
    setWeekToolsMenuOpen(true);
  }

  function selectWeek(nextWeek) {
    if (!TERM_WEEKS.includes(nextWeek) || nextWeek === selectedWeek) return;
    setSelectedWeek(nextWeek);
    setExpandedLessons([]);
    const nextTimetable = normalizeTimetableForStorage(
      mergeBaseWithWeeklyOverlays(baseTimetable, weekLessonOverlays[nextWeek] ?? {})
    );
    setExpandedDays(Object.fromEntries(nextTimetable.map((d) => [d.day, false])));
  }

  function openDuplicateWeekFromUtilities() {
    closeUtilitiesMenu();
    const firstOther = TERM_WEEKS.find((w) => w !== selectedWeek) ?? TERM_WEEKS[0];
    setDuplicateWeekDialog({ targetWeek: firstOther });
  }

  function openArchiveModalFromUtilities() {
    closeUtilitiesMenu();
    setTeacherStudioArchives(readTeacherStudioArchives());
    setArchiveDraftLabel("");
    setArchiveSaveConfirm(false);
    setArchiveRestoreConfirm(null);
    setArchiveModalOpen(true);
  }

  function openStartNewTermFromUtilities() {
    closeUtilitiesMenu();
    setStartNewTermChoice("fresh");
    setStartNewTermModalOpen(true);
  }

  function cancelStartNewTermModal() {
    setStartNewTermModalOpen(false);
  }

  function openStudentNoteEntryForLesson(lesson, dayName) {
    const classTitle = lessonSlotDisplayTitle(lesson);
    const classLabel =
      classTitle && classTitle !== "—"
        ? classTitle
        : (lesson?.subject ?? "").trim() || "Unassigned class";
    setStudentNoteEntryDialog({
      lessonId: lesson.id,
      classLabel,
      day: dayName,
      period: String(lesson?.period ?? "").trim(),
      week: selectedWeek,
    });
    setStudentNoteStudentDraft("");
    setStudentNoteQuickChoiceDraft("");
    setStudentNoteTextDraft("");
  }

  function closeStudentNoteEntryDialog() {
    setStudentNoteEntryDialog(null);
    setStudentNoteStudentDraft("");
    setStudentNoteQuickChoiceDraft("");
    setStudentNoteTextDraft("");
  }

  function saveStudentNoteEntry() {
    if (!studentNoteEntryDialog) return;
    const studentName = studentNoteStudentDraft.trim().slice(0, 120);
    const note = studentNoteTextDraft.trim().slice(0, 4000);
    if (!studentName || !note) return;
    const entry = {
      id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      studentName,
      classLabel: studentNoteEntryDialog.classLabel,
      quickChoice: studentNoteQuickChoiceDraft,
      note,
      createdAt: new Date().toISOString(),
      week: studentNoteEntryDialog.week,
      day: studentNoteEntryDialog.day,
      period: studentNoteEntryDialog.period,
    };
    setStudentNotes((prev) => [entry, ...prev]);
    closeStudentNoteEntryDialog();
  }

  function openStudentNotesFromUtilities() {
    closeUtilitiesMenu();
    setStudentNotesViewerOpen(true);
    setStudentNotesSearch("");
    setStudentNotesViewerScope("individual");
    setStudentNotesClassFilter("");
  }

  function openWeekDatesFromUtilities() {
    closeUtilitiesMenu();
    const selectedMonday = weekDayDateFor(week1StartDate, selectedWeek, "Monday");
    setWeekDateLockWeek(selectedWeek);
    setWeekDateLockMondayIso(
      isoDateFromLocalDate(selectedMonday ?? schoolWeekMonday(new Date()))
    );
    setWeekDateLockDialogOpen(true);
  }

  function closeWeekDatesDialog() {
    setWeekDateLockDialogOpen(false);
  }

  function confirmWeekDatesLock() {
    const picked = parseIsoToLocalDate(weekDateLockMondayIso);
    if (!picked) {
      window.alert("Choose a valid Monday date.");
      return;
    }
    const monday = mondayOfLocalWeek(picked);
    const idx = weekIndexFromLabel(weekDateLockWeek);
    const week1 = new Date(monday);
    week1.setDate(week1.getDate() - idx * 7);
    const nextWeek1 = isoDateFromLocalDate(week1);
    setWeek1StartDate(nextWeek1);
    setSelectedWeek(weekDateLockWeek);
    setSelectedDay("Monday");
    setCalendarMonth({ year: monday.getFullYear(), month: monday.getMonth() });
    setWeekDateLockDialogOpen(false);
  }

  function openLessonExportFromUtilities() {
    closeUtilitiesMenu();
    setLessonExportDialogOpen(true);
    setLessonExportScope("week");
    const firstDayWithLesson = lessonExportDayOptions.find((d) => d.lessons.length > 0)?.day;
    setLessonExportDay(firstDayWithLesson ?? TT_WEEKDAY_ORDER[0] ?? "Monday");
    setLessonExportLessonId("");
    setLessonExportFeedback("");
  }

  function closeLessonExportDialog() {
    setLessonExportDialogOpen(false);
    setLessonExportFeedback("");
  }

  function normalizeLessonExportField(text) {
    return String(text ?? "").trim();
  }

  function collectLessonsForExport() {
    if (lessonExportScope === "week") {
      return lessonExportDayOptions.map((d) => ({ day: d.day, lessons: d.lessons }));
    }
    if (lessonExportScope === "day") {
      const row = lessonExportDayOptions.find((d) => d.day === lessonExportDay);
      return [{ day: lessonExportDay, lessons: row?.lessons ?? [] }];
    }
    const row = lessonExportDayOptions.find((d) => d.day === lessonExportDay);
    const picked = (row?.lessons ?? []).filter((l) => l.id === lessonExportLessonId);
    return [{ day: lessonExportDay, lessons: picked }];
  }

  function formatLessonForExport(lesson) {
    const label = lessonSlotDisplayTitle(lesson);
    const room = normalizeLessonExportField(lesson?.room);
    const note = normalizeLessonExportField(lesson?.note);
    const lp = lesson?.lessonPlan ?? null;
    const focus = normalizeLessonExportField(lp?.lessonTopic);
    const intention = normalizeLessonExportField(lp?.learningIntention);
    const success = Array.isArray(lp?.successCriteria)
      ? lp.successCriteria.map((s) => normalizeLessonExportField(s)).filter(Boolean).join(" · ")
      : "";
    const sequence = Array.isArray(lp?.sequence)
      ? lp.sequence.map((s) => normalizeLessonExportField(s?.text)).filter(Boolean).join(" | ")
      : "";
    return {
      label: label === "—" ? "Unassigned class" : label,
      period: normalizeLessonExportField(lesson?.period),
      time: normalizeLessonExportField(lesson?.time),
      room,
      note,
      focus,
      intention,
      success,
      sequence,
    };
  }

  function buildLessonExportPlainText() {
    const grouped = collectLessonsForExport();
    const total = grouped.reduce((n, g) => n + g.lessons.length, 0);
    if (total === 0) return "";
    const lines = [
      `Teacher Studio lesson share (${selectedWeek})`,
      `Scope: ${lessonExportScope === "week" ? "Week" : lessonExportScope === "day" ? "Day" : "Single lesson"}`,
      "",
    ];
    grouped.forEach((g) => {
      if (!g.lessons.length) return;
      lines.push(`${g.day}`);
      g.lessons.forEach((lesson) => {
        const it = formatLessonForExport(lesson);
        const when = [it.period && `P${it.period}`, it.time].filter(Boolean).join(" - ");
        lines.push(`- ${when ? `${when}: ` : ""}${it.label}`);
        if (it.room) lines.push(`  Room: ${it.room}`);
        if (it.note) lines.push(`  Note: ${it.note}`);
        if (it.focus) lines.push(`  Focus: ${it.focus}`);
        if (it.intention) lines.push(`  Intention: ${it.intention}`);
        if (it.success) lines.push(`  Success: ${it.success}`);
        if (it.sequence) lines.push(`  Sequence: ${it.sequence}`);
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function buildLessonExportMarkdown() {
    const grouped = collectLessonsForExport();
    const total = grouped.reduce((n, g) => n + g.lessons.length, 0);
    if (total === 0) return "";
    const lines = [
      `# Teacher Studio Lesson Share`,
      "",
      `- Week: ${selectedWeek}`,
      `- Scope: ${lessonExportScope === "week" ? "Week" : lessonExportScope === "day" ? "Day" : "Single lesson"}`,
      "",
    ];
    grouped.forEach((g) => {
      if (!g.lessons.length) return;
      lines.push(`## ${g.day}`);
      lines.push("");
      g.lessons.forEach((lesson) => {
        const it = formatLessonForExport(lesson);
        const when = [it.period && `P${it.period}`, it.time].filter(Boolean).join(" - ");
        lines.push(`### ${when ? `${when} - ` : ""}${it.label}`);
        if (it.room) lines.push(`- Room: ${it.room}`);
        if (it.note) lines.push(`- Note: ${it.note}`);
        if (it.focus) lines.push(`- Focus: ${it.focus}`);
        if (it.intention) lines.push(`- Intention: ${it.intention}`);
        if (it.success) lines.push(`- Success: ${it.success}`);
        if (it.sequence) lines.push(`- Sequence: ${it.sequence}`);
        lines.push("");
      });
    });
    return lines.join("\n").trim();
  }

  async function copyLessonExport(format) {
    const text = format === "markdown" ? buildLessonExportMarkdown() : buildLessonExportPlainText();
    if (!text) {
      setLessonExportFeedback("No lessons found for this selection.");
      return;
    }
    const writeWithFallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    };
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        writeWithFallback();
      }
      setLessonExportFeedback(format === "markdown" ? "Markdown copied." : "Plain text copied.");
      window.setTimeout(() => setLessonExportFeedback(""), 2200);
    } catch {
      try {
        writeWithFallback();
        setLessonExportFeedback(format === "markdown" ? "Markdown copied." : "Plain text copied.");
        window.setTimeout(() => setLessonExportFeedback(""), 2200);
      } catch {
        setLessonExportFeedback("Copy failed. Please try again.");
      }
    }
  }

  function confirmStartNewTerm() {
    const resetWeek1StartDate = isoDateFromLocalDate(schoolWeekMonday(new Date()));
    const resetCalendarMonthDate = schoolWeekMonday(new Date());
    if (startNewTermChoice === "full") {
      try {
        sessionStorage.setItem("teacher-studio-new-term-ready", "1");
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(TEACHER_STUDIO_INITIALIZED_KEY);
          } catch {
            /* ignore */
          }
        }
        const fresh = mergePersistedAppState(null);
        const blankMerged = blankTimetableForFullResetFromTemplate(timetableTemplate);
        const baseForReset = stripWeeklyFieldsFromBaseTimetable(extractBaseTimetableFromMerged(blankMerged));
        const clearedWeekOverlays = emptyWeekLessonOverlays();
        const resetSelectedWeek = "Week 1";
        const timetableAfterReset = normalizeTimetableForStorage(
          mergeBaseWithWeeklyOverlays(baseForReset, clearedWeekOverlays[resetSelectedWeek] ?? {})
        );
        const expandedDaysAfterReset = Object.fromEntries(
          timetableAfterReset.map((d) => [d.day, false])
        );
        const app = {
          v: 1,
          sidebarCollapsed: fresh.sidebarCollapsed,
          focusMode: fresh.focusMode,
          calendarReminders: [],
          viewMode: fresh.viewMode,
          selectedDay: "Monday",
          selectedWeek: resetSelectedWeek,
          week1StartDate: resetWeek1StartDate,
          timerSeconds: fresh.timerSeconds,
          editingTimer: fresh.editingTimer,
          timerInput: fresh.timerInput,
          timerRunning: fresh.timerRunning,
          timetable: timetableAfterReset,
          baseTimetable: baseForReset,
          weekLessonOverlays: clearedWeekOverlays,
          lastViewMode: fresh.lastViewMode,
          expandedLessons: [],
          expandedDays: expandedDaysAfterReset,
          fontScale: fresh.fontScale,
          searchQuery: "",
          calendarMonth: { year: resetCalendarMonthDate.getFullYear(), month: resetCalendarMonthDate.getMonth() },
          toolShortcuts: fresh.toolShortcuts,
          dayCountdownTarget: fresh.dayCountdownTarget,
          dayCountdownEventLabel: fresh.dayCountdownEventLabel,
          celebrations: [],
          bellReminderSettings: normalizeBellReminderSettings(fresh.bellReminderSettings),
          monthViewDayNotes: {},
          studentNotes: [],
        };
        writeTeacherStudioSnapshotToLocalStorage({
          app,
          extra: {
            hasWeekTemplate: false,
            unitPlannerJson: JSON.stringify({ byClass: {} }),
            fontScale: String(app.fontScale),
          },
        });
        window.location.reload();
      } catch (e) {
        try {
          sessionStorage.removeItem("teacher-studio-new-term-ready");
        } catch {
          /* ignore */
        }
        window.alert(e?.message ? String(e.message) : "Reset failed.");
      }
      return;
    }
    setStartNewTermModalOpen(false);
    if (startNewTermChoice === "fresh" || startNewTermChoice === "keepUnits") {
      applyFreshStartForDaysAllTermWeeks(TT_WEEKDAY_ORDER);
    }
    setWeek1StartDate(resetWeek1StartDate);
    setSelectedWeek("Week 1");
    setSelectedDay("Monday");
    setCalendarMonth({ year: resetCalendarMonthDate.getFullYear(), month: resetCalendarMonthDate.getMonth() });
    if (startNewTermChoice === "fresh") {
      setUnitStore({ byClass: {} });
      writeUnitPlannerToStorage({ byClass: {} });
    }
    setNewTermReadyToast(true);
    window.setTimeout(() => setNewTermReadyToast(false), 4000);
  }

  function closeArchiveModal() {
    setArchiveModalOpen(false);
    setArchiveSaveConfirm(false);
    setArchiveDraftLabel("");
    setArchiveRestoreConfirm(null);
  }

  function buildTeacherStudioArchiveSnapshot() {
    if (typeof window === "undefined") return null;
    const app = {
      v: 1,
      sidebarCollapsed,
      focusMode,
      calendarReminders,
      viewMode,
      selectedDay,
      selectedWeek,
      week1StartDate,
      timerSeconds,
      editingTimer,
      timerInput,
      timerRunning,
      timetable,
      baseTimetable,
      weekLessonOverlays,
      lastViewMode,
      expandedLessons,
      expandedDays,
      fontScale,
      searchQuery,
      calendarMonth,
      toolShortcuts,
      dayCountdownTarget,
      dayCountdownEventLabel,
      celebrations,
      bellReminderSettings: normalizeBellReminderSettings(bellReminderSettings),
      monthViewDayNotes,
      studentNotes,
    };
    const wt = window.localStorage.getItem(WEEK_TEMPLATE_STORAGE_KEY);
    return {
      v: 1,
      app,
      extra: {
        hasWeekTemplate: wt !== null,
        weekTemplate: wt,
        unitPlannerJson: JSON.stringify(unitStore),
        fontScale: window.localStorage.getItem(TEACHER_STUDIO_FONT_STORAGE_KEY),
      },
    };
  }

  function finalizeCreateTeacherStudioArchive() {
    const snapshot = buildTeacherStudioArchiveSnapshot();
    if (!snapshot?.app) return;
    const label = archiveDraftLabel.trim();
    const entry = {
      id: `arc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      label: label || "Untitled",
      createdAt: new Date().toISOString(),
      snapshot,
    };
    const prev = readTeacherStudioArchives();
    const next = [entry, ...prev].slice(0, TEACHER_STUDIO_ARCHIVES_MAX);
    writeTeacherStudioArchives(next);
    setTeacherStudioArchives(next);
    setArchiveSaveConfirm(false);
    setArchiveDraftLabel("");
  }

  function deleteTeacherStudioArchive(id) {
    const next = readTeacherStudioArchives().filter((a) => a.id !== id);
    writeTeacherStudioArchives(next);
    setTeacherStudioArchives(next);
  }

  function applyTeacherStudioArchiveSnapshot(snapshot) {
    if (typeof window === "undefined") return;
    try {
      writeTeacherStudioSnapshotToLocalStorage(snapshot);
      window.location.reload();
    } catch (e) {
      window.alert(e?.message ? String(e.message) : "Restore failed.");
      setArchiveRestoreConfirm(null);
    }
  }

  function handleUtilityExportFile() {
    closeUtilitiesMenu();
    if (typeof window === "undefined") return;
    const snapshot = buildTeacherStudioArchiveSnapshot();
    if (!snapshot?.app) return;
    try {
      writeTeacherStudioSnapshotToLocalStorage(snapshot);
    } catch (e) {
      window.alert(
        e?.message
          ? String(e.message)
          : "Could not save to this browser. Check storage space and try again."
      );
      return;
    }
    const safeWeek = String(selectedWeek || "Backup").replace(/[^a-zA-Z0-9]+/g, "_");
    const filename = `TeacherStudio_${safeWeek}_Backup.json`;
    const exportDoc = {
      teacherStudioExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      app: snapshot.app,
      extra: snapshot.extra,
    };
    downloadBrowserJsonFile(filename, exportDoc);
    setUtilityExportModalOpen(true);
  }

  function openUtilityImportModal() {
    closeUtilitiesMenu();
    setUtilityImportReplaceConfirm(null);
    setUtilityImportModalOpen(true);
  }

  function closeUtilityExportModal() {
    setUtilityExportModalOpen(false);
  }

  function closeUtilityImportModal() {
    setUtilityImportModalOpen(false);
    setUtilityImportReplaceConfirm(null);
    if (utilityImportInputRef.current) utilityImportInputRef.current.value = "";
  }

  function onUtilityImportFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const parsed = typeof text === "string" ? JSON.parse(text) : null;
        const norm = normalizeTeacherStudioImportJson(parsed);
        if (!norm || !appPayloadLooksLikeTeacherStudio(norm.app)) {
          window.alert("This file could not be read as a Teacher Studio backup.");
          return;
        }
        setUtilityImportReplaceConfirm(norm);
      } catch {
        window.alert("This file could not be read as a Teacher Studio backup.");
      }
    };
    reader.readAsText(file);
  }

  function confirmUtilityImportReplace() {
    const snap = utilityImportReplaceConfirm;
    if (!snap) return;
    try {
      writeTeacherStudioSnapshotToLocalStorage(snap);
      window.location.reload();
    } catch (e) {
      window.alert(e?.message ? String(e.message) : "Import failed.");
      setUtilityImportReplaceConfirm(null);
    }
  }

  function cancelDuplicateWeek() {
    setDuplicateWeekDialog(null);
  }

  function confirmDuplicateWeek() {
    if (!duplicateWeekDialog) return;
    const { targetWeek } = duplicateWeekDialog;
    setWeekLessonOverlays((prev) => ({
      ...prev,
      [targetWeek]: cloneTimetable(prev[selectedWeek] ?? {}),
    }));
    setDuplicateWeekDialog(null);
  }

  function openWeekClearConfirm(kind) {
    closeWeekToolsMenu();
    setWeekClearConfirm({
      kind,
      mode: "whole",
      weekScope: "thisWeek",
      pick: Object.fromEntries(TT_WEEKDAY_ORDER.map((d) => [d, true])),
    });
  }

  function cancelWeekClear() {
    setWeekClearConfirm(null);
  }

  /** Same all-weeks path as “Clear week” → all term weeks; re-used for Start New Term. */
  function applyWeekClearForDaysAllTermWeeks(kind, days) {
    const runClearUpdater = (prev) =>
      prev.map((day) => {
        if (!days.includes(day.day)) return day;
        if (kind === "notes") return clearNotesOnDay(day);
        if (kind === "lessons") return clearLessonsOnDay(day);
        return clearNotesOnDay(clearLessonsOnDay(day));
      });
    const { baseTimetable: b, weekLessonOverlays: wo } = timetableDataRef.current;
    let nextBase = null;
    const nextWo = { ...wo };
    for (const w of TERM_WEEKS) {
      const merged = mergeBaseWithWeeklyOverlays(b, wo[w] ?? {});
      const next = normalizeTimetableForStorage(runClearUpdater(merged));
      const nb = extractBaseTimetableFromMerged(next);
      nextBase = nextBase ?? nb;
      nextWo[w] = extractWeeklyOverlayFromMerged(next);
    }
    setBaseTimetable(nextBase ?? b);
    setWeekLessonOverlays(nextWo);
  }

  /** Start New Term (fresh / keep units): strip notes & lesson plans from current merged data; keep subjects, rooms, duties, times. */
  function applyFreshStartForDaysAllTermWeeks(days) {
    const runStrip = (prev) =>
      prev.map((day) => {
        if (!days.includes(day.day)) return day;
        return stripLessonContentFromMergedDay(day);
      });
    const { baseTimetable: b, weekLessonOverlays: wo, selectedWeek: sw } = timetableDataRef.current;
    const preMerged = normalizeTimetableForStorage(mergeBaseWithWeeklyOverlays(b, wo[sw] ?? {}));
    summarizeTimetableStructureForLog(`Before Fresh start (selected week ${sw})`, preMerged);

    let nextBase = null;
    const nextWo = { ...wo };
    for (const w of TERM_WEEKS) {
      const merged = mergeBaseWithWeeklyOverlays(b, wo[w] ?? {});
      const next = normalizeTimetableForStorage(runStrip(merged));
      const nb = extractBaseTimetableFromMerged(next);
      nextBase = nextBase ?? nb;
      nextWo[w] = extractWeeklyOverlayFromMerged(next);
    }
    const finalBase = nextBase ?? b;
    const postMerged = normalizeTimetableForStorage(
      mergeBaseWithWeeklyOverlays(finalBase, nextWo[sw] ?? {})
    );
    summarizeTimetableStructureForLog(`After Fresh start (selected week ${sw})`, postMerged);

    setBaseTimetable(finalBase);
    setWeekLessonOverlays(nextWo);
  }

  function confirmWeekClearAction() {
    if (!weekClearConfirm) return;
    const { kind, mode, pick, weekScope = "thisWeek" } = weekClearConfirm;
    const days =
      mode === "whole" ? [...TT_WEEKDAY_ORDER] : TT_WEEKDAY_ORDER.filter((d) => pick[d]);
    if (days.length === 0) {
      cancelWeekClear();
      return;
    }

    const runClearUpdater = (prev) =>
      prev.map((day) => {
        if (!days.includes(day.day)) return day;
        if (kind === "notes") return clearNotesOnDay(day);
        if (kind === "lessons") return clearLessonsOnDay(day);
        return clearNotesOnDay(clearLessonsOnDay(day));
      });

    if (kind === "load") {
      const saved = readWeekTemplateFromStorage();
      if (!saved) {
        cancelWeekClear();
        return;
      }
      const runLoad = (prev) =>
        prev.map((day) => {
          if (!days.includes(day.day)) return day;
          const tmplDay = saved.timetable.find((x) => x.day === day.day);
          if (!tmplDay) return day;
          return resetDayToTemplate(day, tmplDay);
        });
      if (weekScope === "allWeeks") {
        const { baseTimetable: b, weekLessonOverlays: wo } = timetableDataRef.current;
        let nextBase = null;
        const nextWo = { ...wo };
        for (const w of TERM_WEEKS) {
          const merged = mergeBaseWithWeeklyOverlays(b, wo[w] ?? {});
          const next = normalizeTimetableForStorage(runLoad(merged));
          const nb = extractBaseTimetableFromMerged(next);
          nextBase = nextBase ?? nb;
          nextWo[w] = extractWeeklyOverlayFromMerged(next);
        }
        setBaseTimetable(nextBase ?? b);
        setWeekLessonOverlays(nextWo);
      } else {
        applyTimetableUpdate(runLoad);
      }
    } else if (weekScope === "allWeeks") {
      applyWeekClearForDaysAllTermWeeks(kind, days);
    } else {
      applyTimetableUpdate(runClearUpdater);
    }
    cancelWeekClear();
    closeWeekToolsMenu();
  }

  function startInlineEdit(itemId, field, currentValue, type = "lesson") {
    setEditingField({ itemId, field, type });
    setEditingValue(currentValue);
  }

  function cancelInlineEdit() {
    setEditingField(null);
    setEditingValue("");
  }

  function saveInlineEdit() {
    if (!editingField) return;

    const trimmedValue = editingValue.trim();
    const isLessonSubject = editingField.type === "lesson" && editingField.field === "subject";
    const isLessonTime = editingField.type === "lesson" && editingField.field === "time";
    const isLessonTopic = editingField.type === "lesson" && editingField.field === "lessonTopic";
    const allowEmpty =
      editingField.type === "duty" ||
      editingField.field === "note" ||
      editingField.field === "room" ||
      editingField.field === "classGroup" ||
      editingField.field === "lessonTopic";

    if (!trimmedValue && !allowEmpty && !isLessonSubject && !isLessonTime) {
      cancelInlineEdit();
      return;
    }

    const nextVal =
      isLessonSubject || isLessonTime ? trimmedValue || "—" : trimmedValue;

    if (isLessonTopic) {
      applyTimetableUpdate((prev) =>
        prev.map((day) => ({
          ...day,
          items: day.items.map((item) => {
            if (item.id !== editingField.itemId || item.type !== "lesson") return item;
            const lp = { ...(item.lessonPlan || {}) };
            lp.lessonTopic = trimmedValue;
            return { ...item, lessonPlan: lp };
          }),
        }))
      );
      cancelInlineEdit();
      return;
    }

    if (editingField.type === "lesson" && editingField.field === "room") {
      const lesson = findLessonInTimetable(timetable, editingField.itemId);
      if (lesson) {
        const n = countLessonsMatchingSubject(timetable, lesson.subject);
        const prevRoom = (lesson.room ?? "").trim();
        if (n > 1 && prevRoom !== trimmedValue) {
          setRoomApplyPrompt({
            lessonId: editingField.itemId,
            subject: lesson.subject ?? "",
            newRoom: trimmedValue,
          });
          cancelInlineEdit();
          return;
        }
      }
    }

    if (editingField.type === "duty" && editingField.field === "time") {
      const slot = findDutySlotInTimetable(timetable, editingField.itemId);
      if (slot) {
        const dayRow = timetable.find((d) => d.day === slot.day);
        const duty = dayRow?.items[slot.itemIndex];
        if (duty && duty.type === "duty") {
          const oldT = (duty.time ?? "").trim();
          if (trimmedValue !== oldT) {
            setDutyTimeApplyPrompt({
              dutyId: editingField.itemId,
              itemIndex: slot.itemIndex,
              newTime: trimmedValue,
              oldTime: oldT,
            });
            cancelInlineEdit();
            return;
          }
        }
      }
    }

    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === editingField.itemId
            ? { ...item, [editingField.field]: nextVal }
            : item
        ),
      }))
    );

    cancelInlineEdit();
  }

  function applyDutyTimeThisDayOnly() {
    if (!dutyTimeApplyPrompt) return;
    const { dutyId, newTime } = dutyTimeApplyPrompt;
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === dutyId && item.type === "duty" ? { ...item, time: newTime } : item
        ),
      }))
    );
    setDutyTimeApplyPrompt(null);
  }

  function applyDutyTimeAllDaysInRow() {
    if (!dutyTimeApplyPrompt) return;
    const { itemIndex, newTime } = dutyTimeApplyPrompt;
    applyTimetableUpdate((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.map((item, idx) =>
          idx === itemIndex && item.type === "duty" ? { ...item, time: newTime } : item
        ),
      }))
    );
    setDutyTimeApplyPrompt(null);
  }

  function cancelDutyTimeApply() {
    setDutyTimeApplyPrompt(null);
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, dayIndex, itemIndex) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItemInfo({ dayIndex, itemIndex });
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetDayIndex, targetItemIndex) => {
    e.preventDefault();
    if (!draggedItemInfo) return;

    const { dayIndex: sourceDayIndex, itemIndex: sourceItemIndex } = draggedItemInfo;

    // Prevent dropping if no movement occurred
    if (sourceDayIndex === targetDayIndex && sourceItemIndex === targetItemIndex) {
      setDraggedItemInfo(null);
      return;
    }

    applyTimetableUpdate(prev => {
      const newTimetable = [...prev];
      const sourceDay = { ...newTimetable[sourceDayIndex] };
      const targetDay = { ...newTimetable[targetDayIndex] };

      sourceDay.items = [...sourceDay.items];
      if (sourceDayIndex !== targetDayIndex) {
        targetDay.items = [...targetDay.items];
      }

      // Extract item
      const [movedItem] = sourceDay.items.splice(sourceItemIndex, 1);

      // Insert item
      if (sourceDayIndex === targetDayIndex) {
        sourceDay.items.splice(targetItemIndex, 0, movedItem);
        newTimetable[sourceDayIndex] = sourceDay;
      } else {
        targetDay.items.splice(targetItemIndex, 0, movedItem);
        newTimetable[sourceDayIndex] = sourceDay;
        newTimetable[targetDayIndex] = targetDay;
      }

      return newTimetable;
    });

    setDraggedItemInfo(null);
  };

  const isDraggableEnabled = !normalizedSearch;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="relative flex min-h-screen overflow-hidden">
        <AnimatePresence>
          {!focusMode && (
            <motion.aside
              className={cn(
                "z-20 m-4 mr-0 flex h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-[5px] border border-slate-800 bg-slate-900 shadow-xl text-white",
                sidebarCollapsed ? "w-24" : "w-80"
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed ? (
                    <div key="full-logo" className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Teacher</p>
                      <h1 className="truncate text-base font-semibold">Command Center</h1>
                    </div>
                  ) : (
                    <div key="rail-logo" className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-slate-900 text-white">
                      <PanelLeft className="h-5 w-5" />
                    </div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-full border border-slate-200 bg-slate-800 p-2 text-slate-100 shadow-sm transition hover:bg-slate-700"
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>

              <div className="px-4 py-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={sidebarSearchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={sidebarCollapsed ? "" : "Search lessons, rooms, reminders"}
                    className={cn(
                      "w-full rounded-full border border-slate-700 bg-slate-800 py-2.5 text-sm outline-none ring-0 transition focus:border-slate-300",
                      sidebarCollapsed ? "px-3" : "pl-9 pr-4 text-white"
                    )}
                  />
                </div>
              </div>

              {!sidebarCollapsed && (
                <div className="px-4 pb-4">
                  <div className="mx-auto w-full max-w-[180px]">
                    <MiniCalendar
                      reminders={calendarReminders}
                      onSelectDate={openCalendarReminder}
                      calendarMonth={calendarMonth}
                      onPrevMonth={goToPreviousMonth}
                      onNextMonth={goToNextMonth}
                    />
                  </div>
                </div>
              )}

              <div className="relative mt-4 flex min-h-0 flex-1 flex-col border-t border-slate-100">
                <div
                  ref={sidebarUpcomingScrollRef}
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto px-4 pt-4",
                    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                    sidebarMoreBelow && !sidebarCollapsed && "pb-11"
                  )}
                >
                  {!sidebarCollapsed && (
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Upcoming</p>
                        <p className="text-xs text-slate-500">Events, tasks, and reminders</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarUpcomingAllOpen(true)}
                        className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-700 hover:text-white"
                      >
                        View all
                      </button>
                    </div>
                  )}

                  <div className="space-y-1 pb-4 pr-0.5">
                  {filteredUpcomingItems.map((item) => {
                    const tone =
                      item.kind === "celebration"
                        ? CELEBRATION_LIST_TONE
                        : getCalendarEventTone(item.status, item.kind);
                    const showOverdueBadge =
                      item.kind !== "celebration" &&
                      item.status === "overdue" &&
                      !dismissedOverdueBadges.has(item.id);
                    const isDeleting = deleteId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-[5px] p-2 text-left shadow-sm",
                          tone.card,
                          sidebarCollapsed && "p-2"
                        )}
                      >
                        {isDeleting ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-100">Delete?</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.kind === "celebration") {
                                    setCelebrations((prev) => prev.filter((c) => c.id !== item.id));
                                  } else {
                                    setCalendarReminders((prev) => prev.filter((r) => r.id !== item.id));
                                  }
                                  setDeleteId(null);
                                }}
                                className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm hover:bg-red-50"
                              >
                                Yes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={
                                item.kind === "celebration"
                                  ? undefined
                                  : () => openCalendarReminder(item.date, item)
                              }
                              className={cn(
                                "min-w-0 flex-1",
                                item.kind !== "celebration" && "cursor-pointer"
                              )}
                            >
                              {!sidebarCollapsed ? (
                                <>
                                  <div className="mb-1.5 flex items-center gap-1.5">
                                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm", tone.chip)}>
                                      {item.kind === "celebration" ? "Celebration" : item.kind}
                                    </span>
                                    {showOverdueBadge ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDismissedOverdueBadges((prev) => {
                                            const next = new Set(prev);
                                            next.add(item.id);
                                            return next;
                                          });
                                        }}
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm",
                                          tone.overdueChip
                                        )}
                                        aria-label="Dismiss overdue badge"
                                        title="Dismiss overdue badge"
                                      >
                                        OVERDUE
                                        <span className="text-[10px] leading-none">×</span>
                                      </button>
                                    ) : null}
                                    <span className={cn("text-[10px] font-medium", tone.text)}>
                                      {item.dayName} {item.date}{" "}
                                      {new Date(item.year, item.month, 1).toLocaleDateString("en-AU", { month: "short" })}
                                      {item.kind === "celebration" && item.celebrationYearly ? (
                                        <span className="text-purple-200/90"> · yearly</span>
                                      ) : null}
                                    </span>
                                  </div>
                                  <p className="truncate text-sm font-bold text-white">{item.title}</p>
                                </>
                              ) : (
                                <div className="flex w-full justify-center py-2" />
                              )}
                            </div>

                            {!sidebarCollapsed && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteId(item.id)}
                                  className="rounded-full border border-white/25 bg-white/10 p-1 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>

                {!sidebarCollapsed && sidebarMoreBelow && (
                  <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
                    <button
                      type="button"
                      onClick={scrollSidebarUpcomingDown}
                      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-800/95 text-slate-200 shadow-lg backdrop-blur-sm transition hover:border-white/30 hover:bg-slate-800 hover:text-white"
                      aria-label="Scroll down for more"
                      title="More below"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-slate-100 p-4">
                <button
                  type="button"
                  onClick={toggleFocusMode}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 shadow-sm transition hover:border-slate-500 hover:bg-slate-700 hover:text-slate-200"
                >
                  <Focus className="h-4 w-4 text-slate-300" />
                  {!sidebarCollapsed && <span>{focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}</span>}
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="relative flex-1 p-4 overflow-hidden">
          {focusMode && (
            <div className="absolute right-6 top-6 z-50 flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow"
              >
                {expandScopeDays.every((day) =>
                  day.items.filter((i) => i.type === "lesson").every((lesson) => expandedLessons.includes(lesson.id))
                )
                  ? "Collapse"
                  : "Expand"}
              </button>
              <button
                type="button"
                onClick={() => bumpFontScale(-FONT_SCALE_STEP)}
                disabled={fontScale <= FONT_SCALE_MIN}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow disabled:cursor-not-allowed disabled:opacity-40"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => bumpFontScale(FONT_SCALE_STEP)}
                disabled={fontScale >= FONT_SCALE_MAX}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow disabled:cursor-not-allowed disabled:opacity-40"
              >
                A+
              </button>
              <button
                onClick={toggleFocusMode}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg"
              >
                Exit Focus
              </button>
            </div>
          )}

          <TimetableStudioPanel
            components={{
              FlipClock,
              Search,
              LessonSlotRow,
              DutyRow,
              SlotLessonDetailOverlay,
              DelayedHoverTooltip,
              DashboardShortcutChip,
              Bell,
              Plus,
              CalendarDays,
              ChevronDown,
              ChevronsUpDown,
              Wrench,
              X,
            }}
            focusMode={focusMode}
            selectedWeek={selectedWeek}
            selectWeek={selectWeek}
            termWeeks={TERM_WEEKS}
            timerRunning={timerRunning}
            timerSeconds={timerSeconds}
            handleTimerToggle={handleTimerToggle}
            editingTimer={editingTimer}
            timerInput={timerInput}
            setTimerInput={setTimerInput}
            handleTimerEditSave={handleTimerEditSave}
            handleTimerEditStart={handleTimerEditStart}
            formattedTimer={formattedTimer}
            editingDayCountdown={editingDayCountdown}
            setDayCountdownDraft={setDayCountdownDraft}
            dayCountdownDraft={dayCountdownDraft}
            setDayCountdownTarget={setDayCountdownTarget}
            normalizeDayCountdownTarget={normalizeDayCountdownTarget}
            setEditingDayCountdown={setEditingDayCountdown}
            daysUntilTarget={daysUntilTarget}
            dayCountdownEventLabel={dayCountdownEventLabel}
            setDayCountdownEventLabel={setDayCountdownEventLabel}
            bellReminderAnchor={bellReminderAnchor}
            setBellReminderAnchor={setBellReminderAnchor}
            cancelShortcutFlyoutClose={cancelShortcutFlyoutClose}
            setShortcutActionMenu={setShortcutActionMenu}
            setDashboardToolsMenu={setDashboardToolsMenu}
            setDashboardToolsView={setDashboardToolsView}
            setCalcPopoverAnchor={setCalcPopoverAnchor}
            setCelebrationsAnchor={setCelebrationsAnchor}
            bellReminderSettings={bellReminderSettings}
            calcPopoverAnchor={calcPopoverAnchor}
            celebrationsAnchor={celebrationsAnchor}
            dashboardToolsMenu={dashboardToolsMenu}
            setEditingShortcutId={setEditingShortcutId}
            setShortcutDraftLabel={setShortcutDraftLabel}
            setShortcutDraftHref={setShortcutDraftHref}
            toolShortcuts={toolShortcuts}
            suppressShortcutLinkNavRef={suppressShortcutLinkNavRef}
            openShortcutFlyout={openShortcutFlyout}
            scheduleShortcutFlyoutClose={scheduleShortcutFlyoutClose}
            bumpFontScale={bumpFontScale}
            fontScaleMin={FONT_SCALE_MIN}
            fontScaleMax={FONT_SCALE_MAX}
            fontScaleStep={FONT_SCALE_STEP}
            fontScale={fontScale}
            utilitiesBtnRef={utilitiesBtnRef}
            toggleUtilitiesMenu={toggleUtilitiesMenu}
            utilitiesMenuOpen={utilitiesMenuOpen}
            focusSidebarSearch={focusSidebarSearch}
            viewMode={viewMode}
            setViewMode={setViewMode}
            calendarMonth={calendarMonth}
            goToPreviousMonth={goToPreviousMonth}
            goToNextMonth={goToNextMonth}
            filteredUpcomingItems={filteredUpcomingItems}
            upcomingMonthListTextClass={upcomingMonthListTextClass}
            selectedWeekDateLabelsByDay={selectedWeekDateLabelsByDay}
            monthViewDayNotes={monthViewDayNotes}
            onMonthViewDayNoteCommit={handleMonthViewDayNoteCommit}
            normalizedSearch={normalizedSearch}
            filteredTimetable={filteredTimetable}
            timetable={timetable}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            handleAddLesson={handleAddLesson}
            handleExpandAll={handleExpandAll}
            visibleDays={visibleDays}
            searchQuery={searchQuery}
            lessonSlotHasPlan={lessonSlotHasPlan}
            handleFillDay={handleFillDay}
            toggleDayExpanded={toggleDayExpanded}
            expandedDays={expandedDays}
            isDraggableEnabled={isDraggableEnabled}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            openSlotLessonOverlay={openSlotLessonOverlay}
            openAddLessonForSlot={openAddLessonForSlot}
            openAccentPicker={openAccentPicker}
            openStudentNoteEntryForLesson={openStudentNoteEntryForLesson}
            commitLessonLineNote={commitLessonLineNote}
            commitLessonSlotNote={commitLessonSlotNote}
            onLessonHeaderCommitAttempt={onLessonHeaderCommitAttempt}
            subjectApplyPrompt={subjectApplyPrompt}
            openCalendarFromLessonSlot={openCalendarFromLessonSlot}
            expandedLessons={expandedLessons}
            toggleLessonExpand={toggleLessonExpand}
            editingField={editingField}
            editingValue={editingValue}
            startInlineEdit={startInlineEdit}
            setEditingValue={setEditingValue}
            saveInlineEdit={saveInlineEdit}
            cancelInlineEdit={cancelInlineEdit}
            unitStore={unitStore}
            slotOverlayLessonId={slotOverlayLessonId}
            findLessonInTimetable={findLessonInTimetable}
            findLessonDayNameInTimetable={findLessonDayNameInTimetable}
            closeSlotLessonOverlay={closeSlotLessonOverlay}
            saveSlotOverlayLesson={saveSlotOverlayLesson}
            handleTimerReset={handleTimerReset}
            insertCellsAtAnchor={insertCellsAtAnchor}
            removeCellsAtAnchor={removeCellsAtAnchor}
          />
          {bellReminderToast ? (
            <div
              className="pointer-events-auto absolute bottom-6 left-1/2 z-[210] w-[min(92vw,24rem)] -translate-x-1/2 cursor-pointer rounded-xl border-2 border-black bg-red-500 px-4 py-2.5 text-center shadow-lg"
              role="status"
              onClick={() => setBellReminderToast(null)}
            >
              <p className="text-sm font-semibold text-white">{bellReminderToast.text}</p>
              <p className="mt-0.5 text-[9px] font-medium text-white/90">Tap to dismiss</p>
            </div>
          ) : null}
          {addLessonOpen ? (
            <AddLessonPanel
              draft={addLessonDraft}
              setDraft={setAddLessonDraft}
              timetable={timetable}
              unitStore={unitStore}
              onClose={closeAddLessonForm}
              onSubmit={submitAddLessonForm}
            />
          ) : null}

          {unitPlannerOpen ? (
            <UnitPlannerPanel
              open={unitPlannerOpen}
              onClose={() => setUnitPlannerOpen(false)}
              classOptions={timetableClassLabels}
              onSave={handleSaveUnitPlannerEntry}
            />
          ) : null}

          {viewUnitsOpen ? (
            <ViewUnitsPanel
              open={viewUnitsOpen}
              onClose={() => setViewUnitsOpen(false)}
              unitStore={unitStore}
              classOptions={viewUnitClassOptions}
            />
          ) : null}

          <UtilitiesMenusAndModals
            studioFloatingAnchorClass={studioFloatingAnchorClass}
            components={{ ArchiveBox, X }}
            utilitiesMenuOpen={utilitiesMenuOpen}
            utilitiesMenuRef={utilitiesMenuRef}
            closeUtilitiesMenu={closeUtilitiesMenu}
            openDuplicateWeekFromUtilities={openDuplicateWeekFromUtilities}
            openNewWeekSubmenuFromUtilities={openNewWeekSubmenuFromUtilities}
            onOpenUnitPlannerFromUtilities={() => {
              setUnitPlannerOpen(true);
              closeUtilitiesMenu();
            }}
            onOpenViewUnitsFromUtilities={() => {
              setViewUnitsOpen(true);
              closeUtilitiesMenu();
            }}
            onOpenWeekDatesFromUtilities={openWeekDatesFromUtilities}
            onOpenStudentNotesFromUtilities={openStudentNotesFromUtilities}
            onOpenLessonExportFromUtilities={openLessonExportFromUtilities}
            handleUtilityExportFile={handleUtilityExportFile}
            openUtilityImportModal={openUtilityImportModal}
            openArchiveModalFromUtilities={openArchiveModalFromUtilities}
            weekToolsMenuOpen={weekToolsMenuOpen}
            weekToolsMenuRef={weekToolsMenuRef}
            closeWeekToolsMenu={closeWeekToolsMenu}
            openWeekClearConfirm={openWeekClearConfirm}
            readWeekTemplateFromStorage={readWeekTemplateFromStorage}
            weekClearConfirm={weekClearConfirm}
            weekClearDialogRef={weekClearDialogRef}
            cancelWeekClear={cancelWeekClear}
            setWeekClearConfirm={setWeekClearConfirm}
            selectedWeek={selectedWeek}
            termWeeks={TERM_WEEKS}
            weekdayOrder={TT_WEEKDAY_ORDER}
            confirmWeekClearAction={confirmWeekClearAction}
            archiveModalOpen={archiveModalOpen}
            closeArchiveModal={closeArchiveModal}
            archiveDraftLabel={archiveDraftLabel}
            setArchiveDraftLabel={setArchiveDraftLabel}
            archiveSaveConfirm={archiveSaveConfirm}
            setArchiveSaveConfirm={setArchiveSaveConfirm}
            finalizeCreateTeacherStudioArchive={finalizeCreateTeacherStudioArchive}
            teacherStudioArchives={teacherStudioArchives}
            setArchiveRestoreConfirm={setArchiveRestoreConfirm}
            deleteTeacherStudioArchive={deleteTeacherStudioArchive}
            archiveRestoreConfirm={archiveRestoreConfirm}
            applyTeacherStudioArchiveSnapshot={applyTeacherStudioArchiveSnapshot}
            utilityExportModalOpen={utilityExportModalOpen}
            closeUtilityExportModal={closeUtilityExportModal}
            utilityImportModalOpen={utilityImportModalOpen}
            closeUtilityImportModal={closeUtilityImportModal}
            utilityImportInputRef={utilityImportInputRef}
            onUtilityImportFileSelected={onUtilityImportFileSelected}
            utilityImportReplaceConfirm={utilityImportReplaceConfirm}
            setUtilityImportReplaceConfirm={setUtilityImportReplaceConfirm}
            confirmUtilityImportReplace={confirmUtilityImportReplace}
            duplicateWeekDialog={duplicateWeekDialog}
            duplicateWeekDialogRef={duplicateWeekDialogRef}
            cancelDuplicateWeek={cancelDuplicateWeek}
            setDuplicateWeekDialog={setDuplicateWeekDialog}
            confirmDuplicateWeek={confirmDuplicateWeek}
            startNewTermModalOpen={startNewTermModalOpen}
            startNewTermChoice={startNewTermChoice}
            setStartNewTermChoice={setStartNewTermChoice}
            openStartNewTermFromUtilities={openStartNewTermFromUtilities}
            cancelStartNewTermModal={cancelStartNewTermModal}
            confirmStartNewTerm={confirmStartNewTerm}
          />

          {typeof document !== "undefined" &&
            weekDateLockDialogOpen &&
            createPortal(
              <div className="fixed inset-0 z-[228] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/45"
                  aria-label="Close"
                  onClick={closeWeekDatesDialog}
                />
                <div
                  className="relative z-10 w-full max-w-sm rounded-[5px] border border-slate-300 bg-white p-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Lock Week Dates</p>
                    <button
                      type="button"
                      onClick={closeWeekDatesDialog}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Set which week we are in and its Monday date. All weeks align from this.
                  </p>

                  <div className="mt-2">
                    <label className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Current week
                    </label>
                    <select
                      value={weekDateLockWeek}
                      onChange={(e) => setWeekDateLockWeek(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-slate-400"
                    >
                      {TERM_WEEKS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    <label className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Monday date (Australia)
                    </label>
                    <input
                      type="date"
                      value={weekDateLockMondayIso}
                      onChange={(e) => setWeekDateLockMondayIso(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeWeekDatesDialog}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmWeekDatesLock}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Lock Dates
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {typeof document !== "undefined" &&
            lessonExportDialogOpen &&
            createPortal(
              <div className="fixed inset-0 z-[229] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/45"
                  aria-label="Close"
                  onClick={closeLessonExportDialog}
                />
                <div
                  className="relative z-10 w-full max-w-sm rounded-[5px] border border-slate-300 bg-white p-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Share / Export Lessons</p>
                    <button
                      type="button"
                      onClick={closeLessonExportDialog}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{selectedWeek}</p>

                  <div className="mt-2 space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Scope</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: "week", label: "Week" },
                        { key: "day", label: "Day" },
                        { key: "lesson", label: "Single lesson" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setLessonExportScope(opt.key)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                            lessonExportScope === opt.key
                              ? "border-slate-800 bg-slate-800 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {lessonExportScope !== "week" ? (
                    <div className="mt-2">
                      <label className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Day
                      </label>
                      <select
                        value={lessonExportDay}
                        onChange={(e) => setLessonExportDay(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-slate-400"
                      >
                        {lessonExportDayOptions.map((d) => (
                          <option key={d.day} value={d.day}>
                            {d.day} ({d.lessons.length})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {lessonExportScope === "lesson" ? (
                    <div className="mt-2">
                      <label className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Lesson
                      </label>
                      <select
                        value={lessonExportLessonId}
                        onChange={(e) => setLessonExportLessonId(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-slate-400"
                      >
                        {lessonExportLessonOptions.length === 0 ? (
                          <option value="">No lessons</option>
                        ) : null}
                        {lessonExportLessonOptions.map((lesson) => {
                          const label = lessonSlotDisplayTitle(lesson);
                          const period = String(lesson?.period ?? "").trim();
                          return (
                            <option key={lesson.id} value={lesson.id}>
                              {(period ? `P${period} - ` : "") + (label === "—" ? "Unassigned class" : label)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : null}

                  {lessonExportFeedback ? (
                    <p className="mt-2 text-[10px] font-medium text-slate-600">{lessonExportFeedback}</p>
                  ) : null}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => copyLessonExport("plain")}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Copy Plain Text
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLessonExport("markdown")}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Copy Markdown
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {typeof document !== "undefined" &&
            studentNoteEntryDialog &&
            createPortal(
              <div className="fixed inset-0 z-[230] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/45"
                  aria-label="Close"
                  onClick={closeStudentNoteEntryDialog}
                />
                <div
                  className="relative z-10 w-full max-w-sm rounded-[5px] border border-slate-300 bg-white p-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Student Note</p>
                    <button
                      type="button"
                      onClick={closeStudentNoteEntryDialog}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{studentNoteEntryDialog.classLabel}</p>
                  <input
                    type="text"
                    value={studentNoteStudentDraft}
                    onChange={(e) => setStudentNoteStudentDraft(e.target.value)}
                    placeholder="Student name"
                    maxLength={120}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-semibold text-slate-500">Quick choice</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STUDENT_NOTE_QUICK_CHOICES.map((choice) => {
                        const active = studentNoteQuickChoiceDraft === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setStudentNoteQuickChoiceDraft(active ? "" : choice)}
                            className={cn(
                              "rounded-full border px-2 py-1 text-[10px] font-medium transition",
                              active
                                ? "border-slate-800 bg-slate-800 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea
                    value={studentNoteTextDraft}
                    onChange={(e) => setStudentNoteTextDraft(e.target.value)}
                    placeholder="Teacher note"
                    rows={4}
                    maxLength={4000}
                    className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeStudentNoteEntryDialog}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!studentNoteStudentDraft.trim() || !studentNoteTextDraft.trim()}
                      onClick={saveStudentNoteEntry}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {typeof document !== "undefined" &&
            studentNotesViewerOpen &&
            createPortal(
              <div className="fixed inset-0 z-[231] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/50"
                  aria-label="Close"
                  onClick={() => setStudentNotesViewerOpen(false)}
                />
                <div
                  className="relative z-10 flex max-h-[min(80vh,36rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[5px] border border-slate-300 bg-white shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">Student Notes</p>
                    <button
                      type="button"
                      onClick={() => setStudentNotesViewerOpen(false)}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 border-b border-slate-100 px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setStudentNotesViewerScope("individual")}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                          studentNotesViewerScope === "individual"
                            ? "bg-slate-800 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentNotesViewerScope("class")}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                          studentNotesViewerScope === "class"
                            ? "bg-slate-800 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        Class
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentNotesViewerScope("all")}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                          studentNotesViewerScope === "all"
                            ? "bg-slate-800 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        All Classes
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={studentNotesSearch}
                        onChange={(e) => setStudentNotesSearch(e.target.value)}
                        placeholder={
                          studentNotesViewerScope === "individual"
                            ? "Search student"
                            : studentNotesViewerScope === "class"
                              ? "Search within class"
                              : "Search notes, student, class"
                        }
                        className="min-w-[10rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
                      />
                      {studentNotesViewerScope === "class" ? (
                        <select
                          value={studentNotesClassFilter}
                          onChange={(e) => setStudentNotesClassFilter(e.target.value)}
                          className="min-w-[10rem] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-slate-400"
                        >
                          {studentNoteClassOptions.length === 0 ? (
                            <option value="">No classes</option>
                          ) : null}
                          {studentNoteClassOptions.map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    {filteredStudentNotes.length === 0 ? (
                      <p className="py-8 text-center text-[11px] text-slate-500">No student notes found.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredStudentNotes.map((n) => (
                          <div key={n.id} className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-semibold text-slate-800">{n.studentName}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">{n.classLabel}</span>
                              {n.week ? <span className="text-slate-500">{n.week}</span> : null}
                              {n.day ? <span className="text-slate-500">{n.day}</span> : null}
                              {n.period ? <span className="text-slate-500">{n.period}</span> : null}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-slate-700">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}

          {typeof document !== "undefined" &&
            sidebarUpcomingAllOpen &&
            createPortal(
              <div
                className="fixed inset-0 z-[220] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-upcoming-all-title"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/55"
                  aria-label="Close"
                  onClick={() => setSidebarUpcomingAllOpen(false)}
                />
                <div
                  className="relative z-10 flex max-h-[min(75vh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-[5px] border border-slate-700 bg-slate-900 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
                    <h2 id="sidebar-upcoming-all-title" className="text-sm font-semibold text-white">
                      All upcoming
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSidebarUpcomingAllOpen(false)}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                    {upcomingItems.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-500">No events or reminders yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {upcomingItems.map((item) => {
                          const tone =
                            item.kind === "celebration"
                              ? CELEBRATION_LIST_TONE
                              : getCalendarEventTone(item.status, item.kind);
                          const showOverdueBadge =
                            item.kind !== "celebration" &&
                            item.status === "overdue" &&
                            !dismissedOverdueBadges.has(item.id);
                          const isDeleting = deleteId === item.id;
                          return (
                            <div
                              key={item.id}
                              className={cn("rounded-[5px] p-2 text-left shadow-sm", tone.card)}
                            >
                              {isDeleting ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-100">Delete?</span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setDeleteId(null)}
                                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                                    >
                                      No
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (item.kind === "celebration") {
                                          setCelebrations((prev) => prev.filter((c) => c.id !== item.id));
                                        } else {
                                          setCalendarReminders((prev) => prev.filter((r) => r.id !== item.id));
                                        }
                                        setDeleteId(null);
                                      }}
                                      className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm hover:bg-red-50"
                                    >
                                      Yes
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div
                                    onClick={
                                      item.kind === "celebration"
                                        ? undefined
                                        : () => openCalendarReminder(item.date, item)
                                    }
                                    className={cn(
                                      "min-w-0 flex-1",
                                      item.kind !== "celebration" && "cursor-pointer"
                                    )}
                                  >
                                    <div className="mb-1.5 flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm",
                                          tone.chip
                                        )}
                                      >
                                        {item.kind === "celebration" ? "Celebration" : item.kind}
                                      </span>
                                      {showOverdueBadge ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDismissedOverdueBadges((prev) => {
                                              const next = new Set(prev);
                                              next.add(item.id);
                                              return next;
                                            });
                                          }}
                                          className={cn(
                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm",
                                            tone.overdueChip
                                          )}
                                          aria-label="Dismiss overdue badge"
                                          title="Dismiss overdue badge"
                                        >
                                          OVERDUE
                                          <span className="text-[10px] leading-none">×</span>
                                        </button>
                                      ) : null}
                                      <span className={cn("text-[10px] font-medium", tone.text)}>
                                        {item.dayName} {item.date}{" "}
                                        {new Date(item.year, item.month, 1).toLocaleDateString("en-AU", {
                                          month: "short",
                                        })}
                                        {item.kind === "celebration" && item.celebrationYearly ? (
                                          <span className="text-purple-200/90"> · yearly</span>
                                        ) : null}
                                      </span>
                                    </div>
                                    <p className="truncate text-sm font-bold text-white">{item.title}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDeleteId(item.id)}
                                      className="rounded-full border border-white/25 bg-white/10 p-1 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
                                      aria-label="Delete"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}

          {lessonReplaceConfirm?.draft ? (
            <>
              <div
                className="absolute inset-0 z-[47] bg-slate-900/25"
                onClick={cancelLessonReplace}
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 z-[48] w-[min(calc(100%-1.5rem),20rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
                role="dialog"
                aria-labelledby="replace-lesson-title"
                onClick={(e) => e.stopPropagation()}
              >
                <p id="replace-lesson-title" className="text-sm font-semibold text-slate-900">
                  Replace existing plan?
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {lessonReplaceConfirm.draft.day} {lessonReplaceConfirm.draft.period} already has a saved lesson plan.
                  Replace it with this new one?
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelLessonReplace}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmLessonReplace}
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Replace
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {dutyTimeApplyPrompt ? (
            <>
              <div
                className="absolute inset-0 z-[47] bg-slate-900/25"
                onClick={cancelDutyTimeApply}
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 z-[48] w-[min(calc(100%-1.5rem),22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
                role="dialog"
                aria-labelledby="duty-time-apply-title"
                onClick={(e) => e.stopPropagation()}
              >
                <p id="duty-time-apply-title" className="text-sm font-semibold text-slate-900">
                  Update duty time
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Change to <span className="font-medium text-slate-800">{dutyTimeApplyPrompt.newTime || "—"}</span> for{" "}
                  <span className="font-medium text-slate-800">this day only</span>, or for the{" "}
                  <span className="font-medium text-slate-800">same duty row on every day</span> (matching times across
                  the week)?
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelDutyTimeApply}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyDutyTimeThisDayOnly}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    This day only
                  </button>
                  <button
                    type="button"
                    onClick={applyDutyTimeAllDaysInRow}
                    className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    All days (this row)
                  </button>
                </div>
              </div>
            </>
          ) : null}

          <AnimatePresence>
            {selectedCalendarDate && (
              <>
                <div
                  className="absolute inset-0 z-40 bg-slate-900/20"
                  onClick={closeCalendarReminder}
                />
                <div className="absolute right-6 top-6 z-50 w-full max-w-sm rounded-[5px] border border-slate-800 bg-white p-6 shadow-2xl">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Calendar Reminder</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">{getDayNameFromDate(selectedCalendarDate, calendarMonth.month, calendarMonth.year)}</h3>
                      <p className="mt-1 text-sm text-slate-500">{selectedCalendarDate} {new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</p>
                    </div>
                    <button onClick={closeCalendarReminder} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <label className="mb-3 block text-sm font-medium text-slate-700">Type</label>
                  <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-slate-700 bg-slate-800 p-1">
                    {[{ value: "event", label: "Event" }, { value: "task", label: "Task" }, { value: "reminder", label: "Reminder" }].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCalendarTypeDraft(option.value)}
                        className={cn(
                          "flex-1 rounded-[5px] px-3 py-2 text-xs font-semibold transition",
                          calendarTypeDraft === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <label className="mb-3 block text-sm font-medium text-slate-700">Reminder</label>
                  <textarea
                    value={calendarDraft}
                    onChange={(e) => setCalendarDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-[5px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                    placeholder="Add a note or reminder for this date..."
                  />

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button onClick={closeCalendarReminder} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
                      Cancel
                    </button>
                    <button onClick={saveCalendarReminder} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">
                      Save Reminder
                    </button>
                  </div>
                </div>
              </>
            )}

          </AnimatePresence>
        </main>
      </div>
      {typeof document !== "undefined" &&
        accentPicker &&
        createPortal(
          <div
            ref={accentPopoverRef}
            style={accentPickerFixedStyle(accentPicker.anchor, accentPicker.step)}
            className="pointer-events-auto"
            role="dialog"
            aria-label={accentPicker.step === "palette" ? "Lesson colour" : "Apply colour to matching lessons"}
          >
            {accentPicker.step === "palette" ? (
              <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.18)] backdrop-blur-md">
                <div className="flex items-stretch gap-2">
                  <div className="flex flex-col justify-center border-r border-slate-200/70 pr-2">
                    <button
                      type="button"
                      onClick={() => handleAccentPaletteChoice(null)}
                      title={LESSON_ACCENT_DEFAULT.label}
                      aria-label={LESSON_ACCENT_DEFAULT.label}
                      className={cn(
                        "h-5 w-5 shrink-0 rounded-full transition hover:scale-110 active:scale-100",
                        LESSON_ACCENT_DEFAULT.swatchClass
                      )}
                    />
                  </div>
                  <div className="flex gap-1">
                    {LESSON_ACCENT_FAMILIES.map((fam) => (
                      <div key={fam.pastel.id} className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleAccentPaletteChoice(fam.pastel.id)}
                          title={fam.pastel.label}
                          aria-label={fam.pastel.label}
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full transition hover:scale-110 active:scale-100",
                            fam.pastel.swatchClass
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => handleAccentPaletteChoice(fam.bold.id)}
                          title={fam.bold.label}
                          aria-label={fam.bold.label}
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full transition hover:scale-110 active:scale-100",
                            fam.bold.swatchClass
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-[min(92vw,14.5rem)] rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.18)] backdrop-blur-md">
                <p className="text-[11px] leading-snug text-slate-600">
                  <span className="font-medium text-slate-800">
                    {lessonAccentOption({ accent: accentPicker.pendingAccent }).label}
                  </span>{" "}
                  on all{" "}
                  <span className="font-semibold text-slate-900">
                    {countLessonsMatchingSubject(timetable, accentPicker.subject)}
                  </span>{" "}
                  &ldquo;
                  <span className="break-words" title={accentPicker.subject?.trim() || "(no title)"}>
                    {accentPicker.subject?.trim() || "(no title)"}
                  </span>
                  &rdquo;?
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      applyAccentToAllLessonsWithSubject(
                        accentPicker.subject,
                        accentPicker.pendingAccent
                      );
                      closeAccentPicker();
                    }}
                    className="flex-1 rounded-lg bg-slate-800 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-900"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyAccentToLessonId(accentPicker.lessonId, accentPicker.pendingAccent);
                      closeAccentPicker();
                    }}
                    className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    This one
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAccentPicker((p) => (p ? { ...p, step: "palette", pendingAccent: null } : null))
                  }
                  className="mt-1.5 w-full text-center text-[10px] font-medium text-slate-400 transition hover:text-slate-600"
                >
                  Back
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        roomApplyPrompt &&
        createPortal(
          <div
            ref={roomApplyPopoverRef}
            style={accentPickerFixedStyle(null, "confirm")}
            className="pointer-events-auto"
            role="dialog"
            aria-label="Apply room to matching lessons"
          >
            <RoomApplyDialogBody
              prompt={roomApplyPrompt}
              timetable={timetable}
              onClose={() => setRoomApplyPrompt(null)}
              onApplySelected={(ids) => {
                applyRoomToLessonIds(ids, roomApplyPrompt.newRoom);
                setRoomApplyPrompt(null);
              }}
              onApplyThisSlotOnly={() => {
                applyRoomToLessonId(roomApplyPrompt.lessonId, roomApplyPrompt.newRoom);
                setRoomApplyPrompt(null);
              }}
            />
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        subjectApplyPrompt &&
        createPortal(
          <div
            ref={subjectApplyPopoverRef}
            style={accentPickerFixedStyle(null, "confirm")}
            className="pointer-events-auto"
            role="dialog"
            aria-label="Apply class title to matching lessons"
          >
            <SubjectApplyDialogBody
              prompt={subjectApplyPrompt}
              timetable={timetable}
              onClose={() => setSubjectApplyPrompt(null)}
              onApplySelected={(ids) => {
                applySubjectToLessonIds(ids, subjectApplyPrompt.newSubject);
                setSubjectApplyPrompt(null);
              }}
              onApplyThisSlotOnly={() => {
                commitLessonHeaderLabel(subjectApplyPrompt.lessonId, subjectApplyPrompt.newSubject);
                setSubjectApplyPrompt(null);
              }}
            />
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        shortcutActionMenu &&
        createPortal(
          <div
            ref={shortcutActionMenuRef}
            className="pointer-events-auto"
            style={(() => {
              const panelW = 112;
              const gap = 4;
              const { left, bottom } = shortcutActionMenu.anchor;
              const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
              let leftPx = left;
              const maxLeft = vw - panelW - 8;
              if (leftPx > maxLeft) leftPx = Math.max(8, maxLeft);
              return {
                position: "fixed",
                left: leftPx,
                top: bottom + gap,
                zIndex: 210,
                width: panelW,
              };
            })()}
            role="menu"
            aria-label={`Actions for ${shortcutActionMenu.shortcut.label}`}
            onPointerEnter={cancelShortcutFlyoutClose}
            onPointerLeave={(e) => {
              if (e.pointerType === "touch") return;
              scheduleShortcutFlyoutClose(shortcutActionMenu.shortcut.id);
            }}
          >
            <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white py-0.5 shadow-lg">
              <button
                type="button"
                role="menuitem"
                className="px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  openShortcutEdit(shortcutActionMenu.shortcut, shortcutActionMenu.anchor);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className="px-3 py-2 text-left text-[11px] font-medium text-red-600 hover:bg-red-50"
                onClick={() => {
                  removeToolShortcut(shortcutActionMenu.shortcut.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        dashboardToolsMenu &&
        createPortal(
          <div
            ref={dashboardToolsRef}
            style={dashboardToolsMenuStyle(dashboardToolsMenu)}
            className="pointer-events-auto"
            role="dialog"
            aria-label="Shortcuts"
          >
            <div className="max-h-[min(72vh,22rem)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.18)] backdrop-blur-md">
              {dashboardToolsView === "menu" && (
                <>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Manage shortcuts</p>
                  <p className="mb-2 text-[10px] leading-snug text-slate-400">
                    Links also appear as pills in the bar. Open one below to remove it.
                  </p>
                  {toolShortcuts.length === 0 ? (
                    <p className="mb-2 text-[11px] text-slate-400">None yet — add a link or email.</p>
                  ) : (
                    <ul className="mb-2 space-y-0.5">
                      {toolShortcuts.map((s) => (
                        <li key={s.id} className="flex items-center gap-1">
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium text-slate-800 hover:bg-slate-100"
                          >
                            {s.label}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeToolShortcut(s.id)}
                            className="shrink-0 rounded px-1 text-[12px] leading-none text-slate-400 hover:text-red-600"
                            aria-label={`Remove ${s.label}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShortcutId(null);
                      setShortcutDraftLabel("");
                      setShortcutDraftHref("");
                      setDashboardToolsView("add");
                    }}
                    className="w-full rounded-lg border border-slate-200/90 bg-white py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    + Add shortcut
                  </button>
                </>
              )}
              {dashboardToolsView === "add" && (
                <div>
                  <p className="mb-2 text-[11px] font-medium text-slate-700">
                    {editingShortcutId ? "Edit shortcut" : "Add shortcut"}
                  </p>
                  <label className="mb-0.5 block text-[10px] text-slate-500">Label</label>
                  <input
                    value={shortcutDraftLabel}
                    onChange={(e) => setShortcutDraftLabel(e.target.value)}
                    className="mb-2 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-slate-300"
                    placeholder="e.g. Staff email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveShortcutForm();
                    }}
                  />
                  <label className="mb-0.5 block text-[10px] text-slate-500">URL or email</label>
                  <input
                    value={shortcutDraftHref}
                    onChange={(e) => setShortcutDraftHref(e.target.value)}
                    className="mb-2 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-slate-300"
                    placeholder="https://… or name@school.edu"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveShortcutForm();
                    }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={cancelShortcutForm}
                      className="flex-1 rounded-lg border border-slate-200/90 bg-white py-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={saveShortcutForm}
                      className="flex-1 rounded-lg bg-slate-800 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-900"
                    >
                      {editingShortcutId ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        calcPopoverAnchor &&
        createPortal(
          <div
            ref={calcPopoverRef}
            style={dashboardCalcPanelStyle(calcPopoverAnchor)}
            className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.18)] backdrop-blur-md"
            role="dialog"
            aria-label="Calculator"
          >
            <MiniCalculator onClose={() => setCalcPopoverAnchor(null)} />
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        celebrationsAnchor &&
        createPortal(
          <div
            ref={celebrationPopoverRef}
            style={dashboardCelebrationsPanelStyle(celebrationsAnchor)}
            className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.18)] backdrop-blur-md"
            role="dialog"
            aria-label="Celebrations"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-700">Celebrations</span>
              <button
                type="button"
                onClick={() => setCelebrationsAnchor(null)}
                className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <p className="mb-2 text-[10px] leading-snug text-slate-500">
              Names and dates appear in Upcoming (purple). Turn <strong>Yearly</strong> on to repeat each year on that
              month and day; off for a one-off date.
            </p>
            <div className="mb-2 max-h-[min(52vh,280px)] space-y-2 overflow-y-auto pr-0.5">
              {celebrations.length === 0 ? (
                <p className="text-[11px] text-slate-400">No celebrations yet — add one below.</p>
              ) : (
                celebrations.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-200/90 bg-white px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const v = e.target.value.slice(0, 120);
                          setCelebrations((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: v } : x)));
                        }}
                        placeholder="Name"
                        className="min-w-[6rem] flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none focus:border-slate-300"
                      />
                      <input
                        type="date"
                        value={c.date}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
                          setCelebrations((prev) => prev.map((x) => (x.id === c.id ? { ...x, date: v } : x)));
                        }}
                        className="w-[9.5rem] shrink-0 rounded-md border border-slate-200 px-1 py-1 text-[11px] outline-none focus:border-slate-300"
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 text-[10px] font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={c.yearly !== false}
                          onChange={(e) =>
                            setCelebrations((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, yearly: e.target.checked } : x))
                            )
                          }
                          className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="min-w-0 leading-snug">Yearly (repeats on this month and day)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCelebrations((prev) => prev.filter((x) => x.id !== c.id))}
                        className="shrink-0 self-center rounded-md px-2 py-0.5 text-sm leading-none text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${c.name || "celebration"}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setCelebrations((prev) => [
                  ...prev,
                  { id: `cel-${Date.now()}`, name: "", date: todayIsoDate(), yearly: true },
                ])
              }
              className="shrink-0 rounded-lg border border-purple-200 bg-purple-50 py-2 text-[11px] font-medium text-purple-800 transition hover:bg-purple-100"
            >
              + Add celebration
            </button>
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        bellReminderAnchor &&
        createPortal(
          <div
            ref={bellPopoverRef}
            style={dashboardBellReminderPanelStyle(bellReminderAnchor)}
            className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-red-200/90 bg-red-50/95 p-2.5 shadow-[0_8px_34px_-8px_rgba(127,29,29,0.28)] backdrop-blur-md"
            role="dialog"
            aria-label="Bell reminders"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-800">
                Bell reminders
              </span>
              <button
                type="button"
                onClick={() => setBellReminderAnchor(null)}
                className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <label className="mb-1.5 flex cursor-pointer select-none items-center gap-2 text-[10px] font-medium text-slate-700">
              <input
                type="checkbox"
                checked={bellReminderSettings.enabled}
                onChange={(e) =>
                  setBellReminderSettings((p) => ({ ...p, enabled: e.target.checked }))
                }
                className="h-3.5 w-3.5 shrink-0 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              Reminders on
            </label>
            <label className="mb-2 flex cursor-pointer select-none items-center gap-2 text-[10px] font-medium text-slate-700">
              <input
                type="checkbox"
                checked={bellReminderSettings.soundEnabled}
                onChange={(e) =>
                  setBellReminderSettings((p) => ({ ...p, soundEnabled: e.target.checked }))
                }
                className="h-3.5 w-3.5 shrink-0 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              Play sound
            </label>
            <p className="mb-2 text-[9px] leading-snug text-slate-500">
              You’ll see a notice 5 minutes before each time (this device’s clock). Sound stays off unless you turn it
              on.
            </p>
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Period end bells</p>
            <div className="mb-1.5 max-h-[6.5rem] space-y-1 overflow-y-auto pr-0.5">
              {bellReminderSettings.periodEndTimes.length === 0 ? (
                <p className="text-[10px] text-slate-400">No times yet.</p>
              ) : (
                bellReminderSettings.periodEndTimes.map((hm, idx) => (
                  <div key={`bell-p-${idx}`} className="flex items-center gap-1">
                    <input
                      type="time"
                      value={hm}
                      onChange={(e) =>
                        setBellReminderSettings((prev) => ({
                          ...prev,
                          periodEndTimes: prev.periodEndTimes.map((t, i) =>
                            i === idx ? e.target.value : t
                          ),
                        }))
                      }
                      className="min-w-0 flex-1 rounded-md border border-red-200 bg-white px-1 py-0.5 text-[11px] outline-none focus:border-red-300"
                    />
                    <button
                      type="button"
                      className="shrink-0 px-1 text-sm leading-none text-slate-400 hover:text-red-600"
                      aria-label="Remove period time"
                      onClick={() =>
                        setBellReminderSettings((prev) => ({
                          ...prev,
                          periodEndTimes: prev.periodEndTimes.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setBellReminderSettings((prev) => ({
                  ...prev,
                  periodEndTimes: [...prev.periodEndTimes, "09:00"],
                }))
              }
              className="mb-2 shrink-0 rounded-md border border-red-200/90 bg-red-100/70 py-1 text-[10px] font-medium text-red-900 transition hover:bg-red-200/70"
            >
              + Period end time
            </button>
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Duty times (day + time)
            </p>
            <div className="mb-1.5 max-h-[7.5rem] space-y-1 overflow-y-auto pr-0.5">
              {bellReminderSettings.dutyTimes.length === 0 ? (
                <p className="text-[10px] text-slate-400">Optional — e.g. yard duty on a set day.</p>
              ) : (
                bellReminderSettings.dutyTimes.map((slot, idx) => (
                  <div key={`bell-d-${idx}`} className="flex items-center gap-1">
                    <select
                      value={TT_WEEKDAY_ORDER.includes(slot?.day) ? slot.day : "Monday"}
                      onChange={(e) =>
                        setBellReminderSettings((prev) => ({
                          ...prev,
                          dutyTimes: prev.dutyTimes.map((row, i) =>
                            i === idx ? { ...row, day: e.target.value } : row
                          ),
                        }))
                      }
                      className="w-[3.35rem] shrink-0 rounded-md border border-red-200 bg-white px-0.5 py-0.5 text-[10px] font-medium outline-none focus:border-red-300"
                      aria-label="Duty day"
                    >
                      {TT_WEEKDAY_ORDER.map((d) => (
                        <option key={d} value={d}>
                          {d === "Wednesday" ? "Wed" : d.slice(0, 3)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) =>
                        setBellReminderSettings((prev) => ({
                          ...prev,
                          dutyTimes: prev.dutyTimes.map((row, i) =>
                            i === idx ? { ...row, time: e.target.value } : row
                          ),
                        }))
                      }
                      className="min-w-0 flex-1 rounded-md border border-red-200 bg-white px-1 py-0.5 text-[11px] outline-none focus:border-red-300"
                    />
                    <button
                      type="button"
                      className="shrink-0 px-1 text-sm leading-none text-slate-400 hover:text-red-600"
                      aria-label="Remove duty time"
                      onClick={() =>
                        setBellReminderSettings((prev) => ({
                          ...prev,
                          dutyTimes: prev.dutyTimes.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setBellReminderSettings((prev) => ({
                  ...prev,
                  dutyTimes: [...prev.dutyTimes, { day: "Monday", time: "08:00" }],
                }))
              }
              className="shrink-0 rounded-md border border-slate-200 bg-white py-1 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              + Duty time
            </button>
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        newTermReadyToast &&
        createPortal(
          <div
            className="pointer-events-auto fixed bottom-6 left-1/2 z-[209] max-w-[min(92vw,22rem)] -translate-x-1/2 cursor-pointer rounded-xl border border-slate-300 bg-slate-900 px-4 py-2.5 text-center shadow-lg"
            role="status"
            onClick={() => setNewTermReadyToast(false)}
          >
            <p className="text-sm font-semibold text-white">New term ready</p>
            <p className="mt-0.5 text-[9px] font-medium text-slate-300">Tap to dismiss</p>
          </div>,
          document.body
        )}
    </div>
  );
}
