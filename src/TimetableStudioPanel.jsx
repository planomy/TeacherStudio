import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils/cn.js";

const CAL_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CAL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SCHOOL_WEEKDAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

function monthViewDayNoteKey(year, monthZero, dayNum) {
  return `${year}-${String(monthZero + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
}

function MonthCellDayNoteField({ noteKey, value, onCommit }) {
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) setDraft(value);
  }, [value, noteKey, active]);

  return (
    <div
      className="shrink-0 border-t border-slate-100/90 pt-0.5"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        name={`month-note-${noteKey}`}
        aria-label={`Note for ${noteKey}`}
        maxLength={2000}
        rows={active ? 3 : 1}
        placeholder="Add note or event..."
        className={cn(
          "w-full resize-none overflow-y-auto rounded-sm border border-transparent bg-slate-50/30 px-0.5 py-0.5 text-[9px] leading-snug text-slate-500 placeholder:text-slate-400/75",
          "transition-[max-height] duration-150 ease-out focus:border-slate-200/55 focus:bg-white/85 focus:text-slate-600 focus:outline-none focus:ring-0",
          !active && "max-h-[2.1rem]",
          active && "max-h-[4.75rem]"
        )}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setActive(true)}
        onBlur={(e) => {
          setActive(false);
          onCommit(noteKey, e.target.value);
        }}
      />
    </div>
  );
}

function TimetableStudioMonthGrid({
  calendarMonth,
  goToPreviousMonth,
  goToNextMonth,
  upcomingItems,
  upcomingMonthListTextClass,
  selectedDay,
  setSelectedDay,
  setViewMode,
  monthViewDayNotes,
  onMonthViewDayNoteCommit,
}) {
  const { year, month } = calendarMonth;
  const dim = new Date(year, month + 1, 0).getDate();
  const firstPad = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalCells = Math.ceil((firstPad + dim) / 7) * 7;

  const upcomingByDayOfMonth = useMemo(() => {
    const m = new Map();
    for (const u of upcomingItems) {
      if (u.year !== year || u.month !== month) continue;
      const d = u.date;
      if (!Number.isFinite(d)) continue;
      const list = m.get(d);
      if (list) list.push(u);
      else m.set(d, [u]);
    }
    return m;
  }, [upcomingItems, year, month]);

  const monthTitle = new Date(year, month).toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="col-span-full flex min-h-0 flex-col rounded-[5px] border border-slate-800/80 bg-white/70 p-2 shadow-sm">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-center text-xs font-semibold tracking-tight text-slate-800">{monthTitle}</span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid shrink-0 grid-cols-7 gap-0.5 border-b border-slate-200/90 pb-1">
        {CAL_WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid min-h-0 flex-1 grid-cols-7 gap-0.5 auto-rows-fr overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstPad + 1;
          const inMonth = dayNum >= 1 && dayNum <= dim;
          const d = inMonth ? new Date(year, month, dayNum) : null;
          const dayName = d ? CAL_DAY_NAMES[d.getDay()] : "";
          const isSchool = dayName && SCHOOL_WEEKDAYS.has(dayName);
          const dayUpcoming = inMonth ? upcomingByDayOfMonth.get(dayNum) ?? [] : [];
          const isSelected = isSchool && selectedDay === dayName;
          const noteKey = inMonth ? monthViewDayNoteKey(year, month, dayNum) : "";

          return (
            <div
              key={i}
              role="gridcell"
              aria-label={inMonth ? `${dayNum} ${monthTitle}` : undefined}
              className={cn(
                "flex min-h-[3.25rem] flex-col rounded border px-1 py-0.5 transition",
                !inMonth && "border-transparent bg-transparent",
                inMonth && !isSchool && "border-slate-100/80 bg-slate-50/40",
                inMonth && isSchool && "cursor-pointer border-slate-200/90 bg-white/90 hover:border-slate-300",
                isSelected && "ring-1 ring-slate-700/35"
              )}
              onClick={() => {
                if (!inMonth) return;
                if (isSchool) setSelectedDay(dayName);
                setViewMode("week");
              }}
            >
              {inMonth ? (
                <div className="flex w-full min-h-0 flex-col">
                  <ul
                    className={cn(
                      "mb-0.5 max-h-28 min-h-0 shrink-0 space-y-px overflow-y-auto overflow-x-hidden overscroll-y-contain",
                      "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/90 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                    )}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {dayUpcoming.map((u) => (
                      <li
                        key={u.id}
                        className={cn("truncate text-[9px] leading-tight", upcomingMonthListTextClass(u))}
                        title={u.title}
                      >
                        {u.title}
                      </li>
                    ))}
                  </ul>
                  <MonthCellDayNoteField
                    noteKey={noteKey}
                    value={monthViewDayNotes[noteKey] ?? ""}
                    onCommit={onMonthViewDayNoteCommit}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimetableStudioPanel({
  components,
  focusMode,
  selectedWeek,
  selectWeek,
  termWeeks,
  timerRunning,
  timerSeconds,
  handleTimerToggle,
  editingTimer,
  timerInput,
  setTimerInput,
  handleTimerEditSave,
  handleTimerEditStart,
  formattedTimer,
  editingDayCountdown,
  setDayCountdownDraft,
  dayCountdownDraft,
  setDayCountdownTarget,
  normalizeDayCountdownTarget,
  setEditingDayCountdown,
  daysUntilTarget,
  dayCountdownEventLabel,
  setDayCountdownEventLabel,
  bellReminderAnchor,
  setBellReminderAnchor,
  cancelShortcutFlyoutClose,
  setShortcutActionMenu,
  setDashboardToolsMenu,
  setDashboardToolsView,
  setCalcPopoverAnchor,
  setCelebrationsAnchor,
  bellReminderSettings,
  calcPopoverAnchor,
  celebrationsAnchor,
  dashboardToolsMenu,
  setEditingShortcutId,
  setShortcutDraftLabel,
  setShortcutDraftHref,
  toolShortcuts,
  suppressShortcutLinkNavRef,
  openShortcutFlyout,
  scheduleShortcutFlyoutClose,
  bumpFontScale,
  fontScaleMin,
  fontScaleMax,
  fontScaleStep,
  fontScale,
  utilitiesBtnRef,
  toggleUtilitiesMenu,
  utilitiesMenuOpen,
  focusSidebarSearch,
  viewMode,
  setViewMode,
  calendarMonth,
  goToPreviousMonth,
  goToNextMonth,
  filteredUpcomingItems,
  upcomingMonthListTextClass,
  monthViewDayNotes,
  onMonthViewDayNoteCommit,
  normalizedSearch,
  filteredTimetable,
  timetable,
  selectedDay,
  setSelectedDay,
  handleAddLesson,
  handleExpandAll,
  visibleDays,
  searchQuery,
  lessonSlotHasPlan,
  handleFillDay,
  toggleDayExpanded,
  expandedDays,
  isDraggableEnabled,
  handleDragStart,
  handleDragOver,
  handleDrop,
  openSlotLessonOverlay,
  openAddLessonForSlot,
  openAccentPicker,
  commitLessonLineNote,
  openCalendarFromLessonSlot,
  expandedLessons,
  toggleLessonExpand,
  editingField,
  editingValue,
  startInlineEdit,
  setEditingValue,
  saveInlineEdit,
  cancelInlineEdit,
  slotOverlayLessonId,
  findLessonInTimetable,
  closeSlotLessonOverlay,
  saveSlotOverlayLesson,
  handleTimerReset,
}) {
  const viewTimetable = normalizedSearch ? filteredTimetable : timetable;

  const {
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
  } = components;

  const weekPickerTriggerRef = useRef(null);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [weekMenuPos, setWeekMenuPos] = useState(null);

  const updateWeekMenuPosition = useCallback(() => {
    const el = weekPickerTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const minW = Math.max(r.width, 11 * 16);
    setWeekMenuPos({
      top: r.bottom + 4,
      left: r.left,
      minWidth: minW,
    });
  }, []);

  useEffect(() => {
    if (!weekPickerOpen) return;
    updateWeekMenuPosition();
    const onScroll = () => updateWeekMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [weekPickerOpen, updateWeekMenuPosition]);

  useEffect(() => {
    if (!weekPickerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setWeekPickerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [weekPickerOpen]);

  return (
    <div className="relative h-[calc(100vh-2rem)] overflow-hidden rounded-[5px] border border-white/60 bg-gradient-to-br from-white via-zinc-50 to-slate-100 shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.05),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_30%)]" />

      <div className="relative z-10 flex h-full flex-col px-4 pt-4 pb-0 lg:px-6 lg:pt-6 lg:pb-0">
        <div className="mb-4 flex w-full flex-col gap-4">
          <div className="min-w-0 w-full">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Studio</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">Teaching Studio</h2>
            {!focusMode && (
              <p className="mt-1 text-sm text-slate-500">
                Use the day strip to pick a day in week view, switch to month for a quick scan, and drag items to reorder.
              </p>
            )}
          </div>

          {!focusMode && (
            <div className="flex w-full min-w-0 flex-wrap items-stretch justify-start gap-2">
              <div className="flex h-[3.75rem] min-h-[3.75rem] shrink-0 items-stretch">
                <FlipClock />
              </div>
              <div className="relative inline-flex shrink-0">
                    <button
                      ref={weekPickerTriggerRef}
                      type="button"
                      id="week-picker-trigger"
                      aria-label="Select week"
                      aria-haspopup="listbox"
                      aria-expanded={weekPickerOpen}
                      aria-controls={weekPickerOpen ? "week-picker-listbox" : undefined}
                      title="Load another week’s timetable and notes"
                      onClick={() => setWeekPickerOpen((o) => !o)}
                      className="relative inline-flex h-[3.75rem] max-w-[12rem] cursor-pointer items-center overflow-hidden rounded-[5px] border border-slate-300 bg-white/80 text-left shadow-sm outline-none transition hover:border-slate-400 hover:bg-white focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 py-0 pl-2.5 pr-7">
                        <span className="shrink-0 text-lg font-extrabold uppercase leading-none tracking-tight text-slate-700">
                          Week
                        </span>
                        <span className="min-w-0 truncate text-[2.5rem] font-bold leading-[0.82] tracking-tight text-slate-900 tabular-nums">
                          {(selectedWeek.match(/\d+/) ?? [selectedWeek])[0]}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-transform",
                          weekPickerOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                    {typeof document !== "undefined" &&
                      weekPickerOpen &&
                      weekMenuPos &&
                      createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[190] bg-slate-900/20"
                            aria-hidden
                            onClick={() => setWeekPickerOpen(false)}
                          />
                          <div
                            id="week-picker-listbox"
                            role="listbox"
                            aria-labelledby="week-picker-trigger"
                            className="fixed z-[191] flex max-h-[min(70vh,22rem)] min-w-[11rem] flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
                            style={{
                              top: weekMenuPos.top,
                              left: weekMenuPos.left,
                              minWidth: weekMenuPos.minWidth,
                            }}
                          >
                            {termWeeks.map((w) => (
                              <button
                                key={w}
                                type="button"
                                role="option"
                                aria-selected={w === selectedWeek}
                                className={cn(
                                  "flex w-full px-3 py-2 text-left text-[12.5px] font-medium transition hover:bg-slate-50",
                                  w === selectedWeek
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-800"
                                )}
                                onClick={() => {
                                  selectWeek(w);
                                  setWeekPickerOpen(false);
                                }}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                  </div>
                  <div
                    className={cn(
                      "flex h-[3.75rem] shrink-0 flex-col justify-center gap-1 rounded-[5px] border bg-white px-2 py-1 shadow-sm",
                      timerRunning && timerSeconds <= 3
                        ? timerSeconds % 2 === 0
                          ? "border-red-500 bg-red-50"
                          : "border-red-300 bg-white"
                        : "border-slate-300"
                    )}
                  >
                    <p className="text-[8px] font-medium uppercase leading-none tracking-wide text-slate-400">Timer</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleTimerToggle}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-800 transition hover:bg-slate-100"
                        aria-label={timerRunning ? "Pause timer" : "Start timer"}
                      >
                        {timerRunning ? (
                          <span className="text-sm font-bold leading-none">⏸</span>
                        ) : (
                          <span className="text-xs leading-none">▶</span>
                        )}
                      </button>
                      {editingTimer ? (
                        <input
                          autoFocus
                          value={timerInput}
                          onChange={(e) => setTimerInput(e.target.value)}
                          onBlur={handleTimerEditSave}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimerEditSave();
                          }}
                          className="w-[4.25rem] rounded-md border border-slate-300 bg-white px-1 py-1 text-center text-sm font-bold tabular-nums text-slate-900 outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={handleTimerEditStart}
                          className="min-w-[3.5rem] px-1 text-center text-sm font-bold tabular-nums text-slate-900"
                        >
                          {formattedTimer}
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-[3.75rem] min-h-[3.75rem] shrink-0 flex-col justify-center gap-0.5 overflow-hidden rounded-[5px] border border-slate-300 bg-white px-2 py-1 shadow-sm",
                      editingDayCountdown ? "min-w-[9rem] w-auto max-w-[11rem]" : "w-[7.25rem]"
                    )}
                  >
                    <p className="text-[8px] font-medium uppercase leading-none tracking-wide text-slate-400">
                      Days until
                    </p>
                    <div className="flex min-h-0 min-w-0 items-center">
                      {editingDayCountdown ? (
                        <input
                          type="date"
                          autoFocus
                          value={dayCountdownDraft}
                          onChange={(e) => setDayCountdownDraft(e.target.value)}
                          onBlur={() => {
                            setDayCountdownTarget(normalizeDayCountdownTarget(dayCountdownDraft));
                            setEditingDayCountdown(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setDayCountdownTarget(normalizeDayCountdownTarget(dayCountdownDraft));
                              setEditingDayCountdown(false);
                            }
                          }}
                          className="w-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold tabular-nums text-slate-900 outline-none"
                          title="Target date"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDayCountdownDraft(dayCountdownTarget);
                            setEditingDayCountdown(true);
                          }}
                          className="min-w-0 truncate text-left text-sm font-bold tabular-nums text-slate-900"
                          title="Tap to edit target date"
                        >
                          {daysUntilTarget == null ? "—" : `${daysUntilTarget}d`}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={dayCountdownEventLabel}
                      onChange={(e) => setDayCountdownEventLabel(e.target.value.slice(0, 80))}
                      onBlur={(e) => {
                        const t = e.target.value.trim();
                        if (!t) setDayCountdownEventLabel("Christmas");
                        else setDayCountdownEventLabel(t.slice(0, 80));
                      }}
                      placeholder="Christmas"
                      className="h-[0.875rem] w-full min-w-0 border-0 border-b border-slate-200 bg-transparent p-0 text-[9px] font-medium leading-none text-slate-600 outline-none placeholder:text-slate-400 focus:border-slate-400"
                      title="Label for this countdown"
                      maxLength={80}
                    />
                  </div>
                  <div className="flex min-h-[3.75rem] w-max max-w-full shrink-0 flex-wrap items-center gap-2 rounded-[5px] border border-slate-300 bg-white/80 pl-2.5 pr-3 py-1 shadow-sm">
                    <DelayedHoverTooltip label="Search lessons, rooms, reminders (sidebar)">
                      <button
                        type="button"
                        data-toolbar-search-trigger
                        onClick={() => focusSidebarSearch()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                        aria-label="Focus sidebar search"
                        title="Search"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </DelayedHoverTooltip>
                    <DelayedHoverTooltip label="Bell reminders — period & duty alerts">
                      <button
                        type="button"
                        data-dashboard-bell-trigger
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bellReminderAnchor) {
                            setBellReminderAnchor(null);
                            return;
                          }
                          cancelShortcutFlyoutClose();
                          setShortcutActionMenu(null);
                          setDashboardToolsMenu(null);
                          setDashboardToolsView("menu");
                          setCalcPopoverAnchor(null);
                          setCelebrationsAnchor(null);
                          const el = e.currentTarget;
                          const r = el.getBoundingClientRect();
                          setBellReminderAnchor({
                            left: r.left,
                            top: r.top,
                            width: r.width,
                            height: r.height,
                          });
                        }}
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
                          bellReminderAnchor
                            ? "border-amber-500 bg-amber-50 text-amber-800"
                            : bellReminderSettings.enabled
                              ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        )}
                        aria-label="Bell reminders"
                        aria-expanded={Boolean(bellReminderAnchor)}
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                    </DelayedHoverTooltip>
                    <DelayedHoverTooltip label="Calculator">
                      <button
                        type="button"
                        data-dashboard-calc-trigger
                        onClick={(e) => {
                          e.stopPropagation();
                          if (calcPopoverAnchor) {
                            setCalcPopoverAnchor(null);
                            return;
                          }
                          cancelShortcutFlyoutClose();
                          setShortcutActionMenu(null);
                          setDashboardToolsMenu(null);
                          setDashboardToolsView("menu");
                          setCelebrationsAnchor(null);
                          setBellReminderAnchor(null);
                          const el = e.currentTarget;
                          const r = el.getBoundingClientRect();
                          setCalcPopoverAnchor({
                            left: r.left,
                            top: r.top,
                            width: r.width,
                            height: r.height,
                          });
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                        aria-label="Open calculator"
                        aria-expanded={Boolean(calcPopoverAnchor)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <rect x="4" y="2" width="16" height="20" rx="2" />
                          <path d="M8 6h8M8 10h2m2 0h2M8 14h2m2 0h2M8 18h4" />
                        </svg>
                      </button>
                    </DelayedHoverTooltip>
                    <DelayedHoverTooltip label="Celebrations — birthdays & special dates">
                      <button
                        type="button"
                        data-dashboard-celebrations-trigger
                        onClick={(e) => {
                          e.stopPropagation();
                          if (celebrationsAnchor) {
                            setCelebrationsAnchor(null);
                            return;
                          }
                          cancelShortcutFlyoutClose();
                          setShortcutActionMenu(null);
                          setDashboardToolsMenu(null);
                          setDashboardToolsView("menu");
                          setCalcPopoverAnchor(null);
                          setBellReminderAnchor(null);
                          const el = e.currentTarget;
                          const r = el.getBoundingClientRect();
                          setCelebrationsAnchor({
                            left: r.left,
                            top: r.top,
                            width: r.width,
                            height: r.height,
                          });
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-purple-600 transition hover:bg-purple-50"
                        aria-label="Celebrations"
                        aria-expanded={Boolean(celebrationsAnchor)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 3l1.09 2.26L15.5 6l-2.41.74L12 9l-1.09-2.26L8.5 6l2.41-.74L12 3z" />
                          <path d="M5 13l.9 1.84L8 16l-2.1.64L5 19l-.9-1.86L2 16l2.1-.64L5 13z" />
                          <path d="M19 11l.72 1.48L21 14l-1.64.5L19 16l-.72-1.5L16 14l1.64-.5L19 11z" />
                        </svg>
                      </button>
                    </DelayedHoverTooltip>
                    <DelayedHoverTooltip label="Add or edit bar shortcuts">
                      <button
                        type="button"
                        data-dashboard-tools-trigger
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dashboardToolsMenu) {
                            setDashboardToolsMenu(null);
                            setDashboardToolsView("menu");
                            return;
                          }
                          cancelShortcutFlyoutClose();
                          setShortcutActionMenu(null);
                          setCalcPopoverAnchor(null);
                          setCelebrationsAnchor(null);
                          setBellReminderAnchor(null);
                          setEditingShortcutId(null);
                          setShortcutDraftLabel("");
                          setShortcutDraftHref("");
                          const el = e.currentTarget;
                          const r = el.getBoundingClientRect();
                          setDashboardToolsMenu({
                            left: r.left,
                            top: r.top,
                            width: r.width,
                            height: r.height,
                          });
                          setDashboardToolsView("menu");
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm transition hover:opacity-90"
                        aria-label="Add or manage shortcuts"
                        aria-expanded={Boolean(dashboardToolsMenu)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </DelayedHoverTooltip>
                    {toolShortcuts.map((s) => (
                      <DashboardShortcutChip
                        key={s.id}
                        shortcut={s}
                        suppressNavForIdRef={suppressShortcutLinkNavRef}
                        onOpenFlyout={(shortcut, anchor) => {
                          setDashboardToolsMenu(null);
                          setCalcPopoverAnchor(null);
                          setCelebrationsAnchor(null);
                          setBellReminderAnchor(null);
                          setDashboardToolsView("menu");
                          openShortcutFlyout(shortcut, anchor);
                        }}
                        onScheduleCloseFlyout={scheduleShortcutFlyoutClose}
                        cancelCloseFlyout={cancelShortcutFlyoutClose}
                      />
                    ))}
                  </div>
              <div className="flex h-[3.75rem] shrink-0 items-center gap-1 rounded-[5px] border border-slate-300 bg-white/80 px-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => bumpFontScale(-fontScaleStep)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={fontScale <= fontScaleMin}
                  title="Smaller text"
                  aria-label="Decrease text size"
                >
                  A−
                </button>
                <button
                  type="button"
                  onClick={() => bumpFontScale(fontScaleStep)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={fontScale >= fontScaleMax}
                  title="Larger text"
                  aria-label="Increase text size"
                >
                  A+
                </button>
                <button
                  ref={utilitiesBtnRef}
                  type="button"
                  data-utilities-trigger
                  onClick={toggleUtilitiesMenu}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition",
                    utilitiesMenuOpen
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                  title="Utilities"
                  aria-label="Utilities"
                  aria-expanded={utilitiesMenuOpen}
                  aria-haspopup="menu"
                >
                  <Wrench className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {!focusMode && (
          <div className="mb-5 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 pt-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2 justify-self-start">
              {(normalizedSearch ? filteredTimetable : timetable).map((day) => (
                <React.Fragment key={day.day}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.day);
                    }}
                    className={cn(
                      "w-20 shrink-0 text-center rounded-[5px] border px-3 py-2 text-sm font-medium shadow-sm transition",
                      selectedDay === day.day
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {day.short}
                  </button>
                  {day.day === "Friday" && (
                    <div className="flex flex-wrap items-center gap-2 border-l border-slate-300 pl-3">
                      <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setViewMode("week")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition",
                            viewMode === "week" ? "bg-slate-900 text-white" : "text-slate-600"
                          )}
                        >
                          Week
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("month")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition",
                            viewMode === "month" ? "bg-slate-900 text-white" : "text-slate-600"
                          )}
                        >
                          Month
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center justify-self-center">
              <button
                type="button"
                onClick={handleAddLesson}
                className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                <Plus className="mr-1 inline h-3.5 w-3.5" />
                Add Lesson
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 justify-self-end">
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                title="Toggle Expand All"
              >
                <ChevronsUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{ zoom: fontScale }}
        >
          <div
            className={cn(
              "grid h-full min-h-0 gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400",
              viewMode === "week" ? "grid-cols-1 md:grid-cols-5" : "grid-cols-1"
            )}
          >
          {viewMode === "month" ? (
            <TimetableStudioMonthGrid
              calendarMonth={calendarMonth}
              goToPreviousMonth={goToPreviousMonth}
              goToNextMonth={goToNextMonth}
              upcomingItems={filteredUpcomingItems}
              upcomingMonthListTextClass={upcomingMonthListTextClass}
              monthViewDayNotes={monthViewDayNotes}
              onMonthViewDayNoteCommit={onMonthViewDayNoteCommit}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              setViewMode={setViewMode}
            />
          ) : visibleDays.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-[5px] border border-dashed border-slate-300 bg-white/50 p-8 text-sm text-slate-500">
              No matches for “{searchQuery}”
            </div>
          ) : (
            visibleDays.map((day) => {
              const dayIndex = timetable.findIndex(d => d.day === day.day);

              return (
                <div
                  key={day.day}
                  className={cn(
                    "relative flex min-h-0 flex-col rounded-[5px] border border-slate-800 bg-white/60 p-2 shadow-sm",
                    focusMode && "p-3"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {new Date(2026, 2, dayIndex + 23).getDate()} Mar
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900">{day.day}</h3>
                      {!focusMode && (
                        <p className="text-[11px] text-slate-500">
                          {day.items.filter((i) => i.type === "lesson" && lessonSlotHasPlan(i)).length} planned
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFillDay(day.day)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <CalendarDays className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDayExpanded(day.day)}
                        title={expandedDays[day.day] ? "Collapse all lessons" : "Expand all lessons"}
                        aria-label={expandedDays[day.day] ? "Collapse all lessons" : "Expand all lessons"}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedDays[day.day] && "rotate-180"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "space-y-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400",
                    focusMode && "space-y-2 pr-0"
                  )}>
                    {day.items.map((item, itemIndex) => (
                      <div 
                        key={item.id}
                        draggable={isDraggableEnabled}
                        onDragStart={(e) => {
                          if (!isDraggableEnabled) return;
                          if (e.target.closest?.("input, textarea, button, select, a")) {
                            e.preventDefault();
                            return;
                          }
                          handleDragStart(e, dayIndex, itemIndex);
                        }}
                        onDragOver={isDraggableEnabled ? handleDragOver : undefined}
                        onDrop={(e) => isDraggableEnabled && handleDrop(e, dayIndex, itemIndex)}
                        className={cn(isDraggableEnabled && "cursor-grab active:cursor-grabbing")}
                      >
                        {item.type === "lesson" ? (
                          <LessonSlotRow
                            lesson={item}
                            dayName={day.day}
                            onOpenSlotDetail={openSlotLessonOverlay}
                            onOpenAddLessonForSlot={openAddLessonForSlot}
                            onOpenAccentPicker={openAccentPicker}
                            onLineNoteCommit={commitLessonLineNote}
                            onOpenCalendarKind={(kind, title) =>
                              openCalendarFromLessonSlot(day.day, kind, title)
                            }
                            isFocusDay={focusMode}
                            isExpanded={expandedLessons.includes(item.id)}
                            onToggleExpand={() => toggleLessonExpand(item.id)}
                            editingField={editingField}
                            editingValue={editingValue}
                            onStartEdit={startInlineEdit}
                            onEditChange={setEditingValue}
                            onEditSave={saveInlineEdit}
                            onEditCancel={cancelInlineEdit}
                          />
                        ) : (
                          <DutyRow 
                            duty={item} 
                            editingField={editingField}
                            editingValue={editingValue}
                            onStartEdit={startInlineEdit}
                            onEditChange={setEditingValue}
                            onEditSave={saveInlineEdit}
                            onEditCancel={cancelInlineEdit}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {typeof document !== "undefined" && slotOverlayLessonId
          ? (() => {
              const overlayLesson = findLessonInTimetable(timetable, slotOverlayLessonId);
              return overlayLesson
                ? createPortal(
                    <SlotLessonDetailOverlay
                      lesson={overlayLesson}
                      onClose={closeSlotLessonOverlay}
                      onSave={(patch) => saveSlotOverlayLesson(overlayLesson.id, patch)}
                      onOpenAccentPicker={openAccentPicker}
                      onTimerReset={handleTimerReset}
                    />,
                    document.body
                  )
                : null;
            })()
          : null}
      </div>
    </div>
  );
}
