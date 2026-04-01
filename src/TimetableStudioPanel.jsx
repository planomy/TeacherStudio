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
const STICKY_COLOR_OPTIONS = ["#39ff14", "#fffb00", "#ff4fd8", "#00f5ff", "#ff7f11"];
const STICKY_EDITOR_DEFAULT_WIDTH = 240;
const STICKY_EDITOR_DEFAULT_HEIGHT = 160;
const STICKY_EDITOR_MIN_WIDTH = 192;
const STICKY_EDITOR_MIN_HEIGHT = 120;
const STUDENT_ESSAY_QUOTES = [
  "Although the Industrial Revolution improved lives, it mainly improved smoke.",
  "Since Shakespeare loved drama, he killed people like it was a hobby.",
  "Even though the character was brave, he immediately ran away, which was confusing but relatable.",
  "With great power comes great responsibility, which he ignored almost instantly.",
  "Although the experiment failed, it succeeded in making a loud bang.",
  "Because the government wanted peace, they started a war.",
  "Even though the evidence was clear, the suspect chose not to participate in reality.",
  "While the poem explores deep emotion, I did not.",
  "Since the setting was dark and gloomy, it matched my mood doing this assignment.",
  "Although the author uses symbolism, I will not.",
  "With careful planning, the plan went completely wrong.",
  "Even though Romeo loved Juliet, he made several poor life choices in under three days.",
  "Because the data was confusing, I chose to trust my instincts, which were also wrong.",
  "Although the character learned a lesson, it was unfortunately too late and also avoidable.",
  "While the battle was intense, the strategy was not.",
  "Since the teacher asked for detail, I have included this sentence.",
  "Even though the conclusion should summarise the essay, this one simply ends.",
  "Because the scientist was curious, things exploded.",
  "Although the economy improved, my understanding did not.",
  "With strong evidence presented, I will now ignore it.",
  "Even though the protagonist was determined, the door was more determined.",
  "Since the theme is about courage, nobody shows any.",
  "Although the results were unexpected, they were also unhelpful.",
  "Because the character had a plan, everything immediately fell apart.",
  "While the author intended to inspire, I feel mostly confused.",
  "Since this is a persuasive essay, I will now persuade you that I tried.",
  "Even though the setting is peaceful, something bad obviously happens because otherwise this would be boring.",
  "Although the speech was powerful, it did not convince me to keep reading.",
  "Because the instructions were clear, I misunderstood them creatively.",
  "With deep analysis, I have discovered that this is indeed a story.",
  "Even though the question was simple, my answer is not.",
  "Since the character faces conflict, he handles it poorly.",
  "Although the experiment was controlled, the students were not.",
  "Because the text is complex, I will now simplify it incorrectly.",
  "While the author builds tension, I release it by finishing early.",
  "Since this is a formal essay, I will now stop being formal.",
  "Even though the conclusion should be strong, I am tired.",
  "Although the evidence supports my argument, I forgot what my argument was.",
  "Because the story is tragic, nobody makes a good decision.",
  "With all things considered, I have considered enough.",
  "Although the king was meant to lead wisely, he mainly shouted and made everything worse.",
  "Since the character was described as humble, he spoke about himself for three pages.",
  "Even though the village feared the monster, nobody considered simply moving.",
  "Because the speech was inspirational, I almost believed the speaker believed it too.",
  "While the storm symbolised chaos, it also ruined everyone’s weekend.",
  "Although the soldier showed bravery, his actual plan was just running forwards loudly.",
  "Since the scientist ignored safety procedures, the lab became a learning experience.",
  "Even though the text contains many layers, I have peeled back none of them.",
  "Because the relationship was toxic, it was naturally called romance.",
  "Although the evidence is overwhelming, the villain remains confident for no reason.",
  "While the poem is full of sadness, it is also full of line breaks pretending to be depth.",
  "Since the protagonist wanted freedom, he made choices that produced the opposite.",
  "Even though the setting was beautiful, the people in it were determined to suffer.",
  "Because this is an argument essay, I will now argue with the question.",
  "Although the leader promised change, he delivered a speech and then disappeared emotionally.",
  "Since the character was intelligent, his next decision shocked everybody.",
  "Even though the ancient civilisation was advanced, they still somehow invented problems.",
  "Because the book explores identity, several characters spend the entire plot confused in expensive clothing.",
  "Although the experiment had a hypothesis, the students mostly had vibes.",
  "Since the family was dysfunctional, dinner was basically a live action threat.",
  "While the author creates suspense, the parents in the story create most of the damage.",
  "Because the hero was chosen by destiny, effort was apparently optional.",
  "Although the queen appeared graceful, her behaviour suggested otherwise.",
  "Since the theme is love, everyone communicates in the worst possible way.",
  "Even though the battle was historic, it could have been avoided by one honest conversation.",
  "Because the story is set in the future, common sense has been left behind.",
  "Although the character claimed to be calm, he then delivered three paragraphs of panic.",
  "Since the speech targeted the audience’s emotions, facts were asked to leave.",
  "Even though the plan was secret, the villain explained it to everyone anyway.",
  "Because the conflict is internal, the character suffers privately and dramatically near a window.",
  "Although the setting is symbolic, it is also suspiciously muddy.",
  "Since the narrator is unreliable, trusting him felt like a personal mistake.",
  "Even though the treaty promised peace, it mostly promised future homework for historians.",
  "Because the author uses irony, I laughed once and then felt bad about it.",
  "Although the community wanted justice, they mostly wanted gossip with a legal theme.",
  "Since the conclusion should be memorable, this one leaves quietly through the side door.",
  "Even though the character had potential, he used it for nonsense.",
  "Because the scene is emotional, somebody immediately says the wrong thing.",
  "Although the law was intended to help, it arrived with several unforeseen disasters.",
  "Since the text is persuasive, it repeats itself with confidence.",
  "Even though the main character is mature, the evidence suggests otherwise.",
  "Because the villagers ignored the warning signs, the plot was able to continue.",
  "Although the author presents both sides, one side is clearly wearing clown shoes.",
  "Since this is an informative essay, I am now informing you that the situation was bad.",
  "Even though the relationship began with hope, it continued with red flags and poor listening skills.",
  "Because the kingdom needed saving, the least organised person available took charge.",
  "Although the speech aimed to unite the nation, it mostly annoyed the room.",
  "Since the evidence supports my point, I will act surprised by it.",
  "Even though the character was warned repeatedly, he stayed committed to bad decisions.",
  "Because the ending is tragic, everyone suddenly discovers feelings and it is far too late.",
];

function weekNumberFromLabel(label) {
  const n = Number(String(label ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseLessonRangeMinutes(timeText) {
  const t = String(timeText ?? "");
  const matches = [...t.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length < 2) return null;
  const toMins = (hh, mm) => Number(hh) * 60 + Number(mm);
  const start = toMins(matches[0][1], matches[0][2]);
  const end = toMins(matches[1][1], matches[1][2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return { start, end };
}

function lessonCommandLabel(lesson) {
  const c = String(lesson?.classGroup ?? "").trim();
  const s = String(lesson?.subject ?? "").trim();
  const label = [c, s].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return label || "Unassigned class";
}

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
  dayCountdownTarget,
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
  saveStatus,
  lastSavedAt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  utilitiesBtnRef,
  toggleUtilitiesMenu,
  utilitiesMenuOpen,
  focusSidebarSearch,
  todayStickies,
  setTodayStickies,
  viewMode,
  setViewMode,
  calendarMonth,
  goToPreviousMonth,
  goToNextMonth,
  filteredUpcomingItems,
  upcomingMonthListTextClass,
  selectedWeekDateLabelsByDay,
  monthViewDayNotes,
  onMonthViewDayNoteCommit,
  normalizedSearch,
  hasAnySearchResults,
  filteredTimetable,
  timetable,
  selectedDay,
  setSelectedDay,
  handleAddLesson,
  onOpenUnitOutliner,
  onOpenStudentNotes,
  onOpenStudentLists,
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
  openStudentNoteEntryForLesson,
  commitLessonLineNote,
  commitLessonSlotNote,
  onLessonHeaderCommitAttempt,
  subjectApplyPrompt,
  openCalendarFromLessonSlot,
  expandedLessons,
  toggleLessonExpand,
  editingField,
  editingValue,
  startInlineEdit,
  setEditingValue,
  saveInlineEdit,
  cancelInlineEdit,
  unitStore,
  slotOverlayLessonId,
  findLessonInTimetable,
  findLessonDayNameInTimetable,
  closeSlotLessonOverlay,
  saveSlotOverlayLesson,
  handleTimerReset,
  insertCellsAtAnchor,
  removeCellsAtAnchor,
}) {
  const viewTimetable = normalizedSearch ? filteredTimetable : timetable;
  const schoolDayRows = useMemo(
    () => timetable.filter((day) => SCHOOL_WEEKDAYS.has(day.day)),
    [timetable]
  );

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
    X,
  } = components;

  const weekPickerTriggerRef = useRef(null);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [weekMenuPos, setWeekMenuPos] = useState(null);
  const [activeStickyId, setActiveStickyId] = useState(null);
  const stickyWrapRef = useRef(null);

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

  const todayName = CAL_DAY_NAMES[new Date().getDay()] ?? "";
  const commandDayName = SCHOOL_WEEKDAYS.has(todayName) ? todayName : selectedDay;
  const commandDayRow = timetable.find((d) => d.day === commandDayName) ?? null;
  const commandLessons = useMemo(() => {
    if (!commandDayRow) return [];
    return (commandDayRow.items ?? [])
      .filter((item) => item.type === "lesson")
      .map((lesson) => {
        const range = parseLessonRangeMinutes(lesson.time);
        return {
          lesson,
          start: range?.start ?? Number.POSITIVE_INFINITY,
          end: range?.end ?? Number.POSITIVE_INFINITY,
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [commandDayRow]);
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const nowSlot = commandLessons.find((x) => Number.isFinite(x.start) && Number.isFinite(x.end) && nowMins >= x.start && nowMins < x.end) ?? null;
  const nextSlot =
    commandLessons.find((x) => Number.isFinite(x.start) && x.start > nowMins) ??
    (nowSlot ? null : commandLessons.find((x) => Number.isFinite(x.start))) ??
    null;
  const actionSlot = nowSlot ?? nextSlot ?? commandLessons[0] ?? null;
  const nowLabel = nowSlot ? lessonCommandLabel(nowSlot.lesson) : "No class right now";
  const nextLabel = nextSlot ? lessonCommandLabel(nextSlot.lesson) : "No upcoming class";
  const stickyViewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const stickyViewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const stickyEditorMaxWidth = Math.max(STICKY_EDITOR_MIN_WIDTH, Math.floor(stickyViewportWidth * 0.88));
  const stickyAnchorRect = stickyWrapRef.current?.getBoundingClientRect() ?? null;
  const stickySpaceAbove = stickyAnchorRect
    ? Math.max(120, Math.floor(stickyAnchorRect.top - 14))
    : Math.floor(stickyViewportHeight * 0.55);
  const stickySpaceBelow = stickyAnchorRect
    ? Math.max(120, Math.floor(stickyViewportHeight - stickyAnchorRect.bottom - 14))
    : Math.floor(stickyViewportHeight * 0.35);
  const stickyPreferBelow = stickySpaceAbove < STICKY_EDITOR_DEFAULT_HEIGHT && stickySpaceBelow > stickySpaceAbove;
  const stickyEditorMaxHeight = Math.max(
    STICKY_EDITOR_MIN_HEIGHT,
    Math.floor((stickyPreferBelow ? stickySpaceBelow : stickySpaceAbove) * 0.96)
  );
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return "Last saved: —";
    try {
      return `Last saved: ${new Date(lastSavedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } catch {
      return "Last saved: —";
    }
  }, [lastSavedAt]);
  const stickyChipFlexBasis = useMemo(() => {
    const count = Math.max(1, todayStickies.length);
    if (count <= 2) return 152;
    if (count <= 4) return 124;
    if (count <= 6) return 104;
    return 88;
  }, [todayStickies.length]);
  const weeklyEssayQuote = useMemo(() => {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayIndex = Math.floor(localMidnight.getTime() / 86400000);
    return STUDENT_ESSAY_QUOTES[((dayIndex % STUDENT_ESSAY_QUOTES.length) + STUDENT_ESSAY_QUOTES.length) % STUDENT_ESSAY_QUOTES.length];
  }, []);
  const openDayCountdownEditor = useCallback(() => {
    setDayCountdownDraft(dayCountdownTarget);
    setEditingDayCountdown(true);
  }, [dayCountdownTarget, setDayCountdownDraft, setEditingDayCountdown]);
  const activeSticky = useMemo(
    () => todayStickies.find((item) => item.id === activeStickyId) ?? null,
    [todayStickies, activeStickyId]
  );

  useEffect(() => {
    if (!activeStickyId) return;
    if (!todayStickies.some((item) => item.id === activeStickyId)) {
      setActiveStickyId(null);
    }
  }, [todayStickies, activeStickyId]);

  useEffect(() => {
    if (!activeStickyId) return;
    const onPointerDown = (event) => {
      if (!stickyWrapRef.current) return;
      if (stickyWrapRef.current.contains(event.target)) return;
      setActiveStickyId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeStickyId]);

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-visible rounded-[5px] border border-white/60 bg-gradient-to-br from-white via-zinc-50 to-slate-100 shadow-inner md:h-[calc(100vh-2rem)] md:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.05),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] flex-col px-4 pb-0 pt-4 md:h-full md:min-h-0 lg:px-6 lg:pb-0 lg:pt-6">
        <div className="mb-3 flex w-full flex-col gap-2">
          <div className="relative flex w-full flex-col items-start gap-1 xl:min-h-[3.35rem] xl:items-stretch">
            <h2 className="pointer-events-none text-left text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl xl:absolute xl:left-0 xl:top-0">
              Teaching Studio
            </h2>
            <p className="pointer-events-none max-w-[min(96vw,44rem)] text-left text-[11px] font-medium text-slate-500 sm:max-w-[min(82vw,44rem)] xl:absolute xl:left-0 xl:top-[2rem] xl:max-w-[min(52vw,40rem)] xl:truncate">
              Student essay quote: "{weeklyEssayQuote}"
            </p>
            {!focusMode && (
              <div className="flex w-full flex-wrap items-center justify-center gap-2 xl:justify-end">
                <div
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border bg-white/85 px-2.5 text-[10px] font-semibold shadow-sm transition",
                    saveStatus === "saving" && "border-amber-200 text-amber-700",
                    saveStatus === "saved" && "border-emerald-200 text-emerald-700",
                    saveStatus === "error" && "border-red-200 text-red-700"
                  )}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      saveStatus === "saving" && "bg-amber-500 animate-pulse",
                      saveStatus === "saved" && "bg-emerald-500",
                      saveStatus === "error" && "bg-red-500"
                    )}
                  />
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save issue" : "Saved"}
                </div>
                <span className="rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-sm">
                  {lastSavedLabel}
                </span>
                <div className="flex items-center gap-1 rounded-[5px] border border-slate-300 bg-white/85 p-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex h-9 min-w-[3.15rem] shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Undo (Ctrl/Cmd+Z)"
                    aria-label="Undo"
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="flex h-9 min-w-[3.15rem] shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    aria-label="Redo"
                  >
                    Redo
                  </button>
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
            <div className="rounded-[5px] border border-slate-200 bg-white/85 px-3 py-2 shadow-sm">
              <div className="flex min-h-10 flex-wrap items-center gap-2 xl:flex-nowrap">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    Today · {commandDayName}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                    Now: {nowLabel}
                  </span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-800">
                    Next: {nextLabel}
                  </span>
                </div>
                <div ref={stickyWrapRef} className="relative flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:ml-auto xl:flex-nowrap xl:justify-end">
                  <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden pr-1 xl:justify-end">
                    {todayStickies.map((sticky) => (
                      <button
                        key={sticky.id}
                        type="button"
                        onClick={() => setActiveStickyId((prev) => (prev === sticky.id ? null : sticky.id))}
                        className={cn(
                          "inline-flex h-9 min-w-0 items-center gap-1 rounded-md border border-black/15 px-2 shadow-sm",
                          activeStickyId === sticky.id && "ring-1 ring-black/30"
                        )}
                        style={{
                          backgroundColor: sticky.color || "#39ff14",
                          flex: `1 1 ${stickyChipFlexBasis}px`,
                          maxWidth: `${stickyChipFlexBasis + 32}px`,
                        }}
                        title={(sticky.text ?? "").trim() || "Sticky note"}
                      >
                        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-black/85">
                          {(sticky.text ?? "").trim() || "Sticky note"}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setTodayStickies((prev) => prev.filter((item) => item.id !== sticky.id));
                          }}
                          className="rounded px-1 text-[11px] font-semibold text-black/65 transition hover:bg-black/10 hover:text-black"
                          aria-label="Delete sticky"
                        >
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const id = `sticky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
                      setTodayStickies((prev) => [...prev, { id, text: "", color: "#39ff14", compact: false }]);
                      setActiveStickyId(id);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    + Sticky
                  </button>
                  <button
                    type="button"
                    disabled={!actionSlot}
                    onClick={() =>
                      actionSlot && openStudentNoteEntryForLesson(actionSlot.lesson, commandDayName)
                    }
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Student Note
                  </button>
                  {activeSticky ? (
                    activeSticky.compact ? (
                      <div
                        className="absolute right-0 z-30 min-h-[3rem] min-w-[11rem] max-w-[18rem] rounded-md border border-black/20 px-2 py-1 shadow-xl"
                        style={{
                          backgroundColor: activeSticky.color || "#39ff14",
                          ...(stickyPreferBelow
                            ? { top: "calc(100% + 6px)" }
                            : { bottom: "calc(100% + 6px)" }),
                        }}
                        onClick={() =>
                          setTodayStickies((prev) =>
                            prev.map((item) =>
                              item.id === activeSticky.id ? { ...item, compact: false } : item
                            )
                          )
                        }
                      >
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStickyId(null);
                            }}
                            className="rounded px-1 text-[10px] font-semibold text-black/70 transition hover:bg-black/10 hover:text-black"
                            aria-label="Close sticky"
                          >
                            ×
                          </button>
                        </div>
                        <p className="-mt-0.5 whitespace-pre-wrap break-words text-[12px] font-medium leading-snug text-black">
                          {activeSticky.text}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="absolute right-0 z-30 flex min-h-[10rem] min-w-[12rem] max-w-[20rem] flex-col overflow-visible rounded-lg border border-slate-300 bg-white p-2 shadow-xl"
                        style={{
                          width: `${Math.min(
                            stickyEditorMaxWidth,
                            Math.max(
                              STICKY_EDITOR_MIN_WIDTH,
                              activeSticky.editorWidth && activeSticky.editorWidth > 0
                                ? activeSticky.editorWidth
                                : STICKY_EDITOR_DEFAULT_WIDTH
                            )
                          )}px`,
                          minHeight: `${Math.min(
                            stickyEditorMaxHeight,
                            Math.max(
                              STICKY_EDITOR_MIN_HEIGHT,
                              activeSticky.editorHeight && activeSticky.editorHeight > 0
                                ? activeSticky.editorHeight
                                : STICKY_EDITOR_DEFAULT_HEIGHT
                            )
                          )}px`,
                          ...(stickyPreferBelow
                            ? { top: "calc(100% + 6px)" }
                            : { bottom: "calc(100% + 6px)" }),
                        }}
                        onMouseUp={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTodayStickies((prev) =>
                            prev.map((item) =>
                              item.id === activeSticky.id
                                ? {
                                    ...item,
                                    editorWidth: Math.min(stickyEditorMaxWidth, Math.max(STICKY_EDITOR_MIN_WIDTH, Math.round(rect.width))),
                                    editorHeight: Math.min(stickyEditorMaxHeight, Math.max(STICKY_EDITOR_MIN_HEIGHT, Math.round(rect.height))),
                                  }
                                : item
                            )
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mb-1 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if ((activeSticky.text ?? "").trim()) {
                                setTodayStickies((prev) =>
                                  prev.map((item) =>
                                    item.id === activeSticky.id ? { ...item, compact: true } : item
                                  )
                                );
                                setActiveStickyId(null);
                              }
                            }}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold transition",
                              (activeSticky.text ?? "").trim()
                                ? "text-emerald-700 hover:bg-emerald-50"
                                : "cursor-not-allowed text-slate-300"
                            )}
                            aria-label="Pin sticky"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTodayStickies((prev) =>
                                prev.filter((item) => item.id !== activeSticky.id)
                              );
                              setActiveStickyId(null);
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Delete sticky"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={activeSticky.text ?? ""}
                          onChange={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                            setTodayStickies((prev) =>
                              prev.map((item) =>
                                item.id === activeSticky.id ? { ...item, text: e.target.value } : item
                              )
                            );
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                          }}
                          rows={5}
                          placeholder="Type sticky note..."
                          className="min-h-[8rem] w-full resize-none overflow-hidden rounded-md border border-black/20 px-2 py-1.5 text-[12px] text-slate-900 outline-none focus:border-black/40"
                          style={{ backgroundColor: activeSticky.color || "#39ff14" }}
                        />
                        <div className="mt-2 flex shrink-0 items-center gap-1">
                          {STICKY_COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setTodayStickies((prev) =>
                                  prev.map((item) =>
                                    item.id === activeSticky.id ? { ...item, color: c } : item
                                  )
                                )
                              }
                              className={cn(
                                "h-5 w-5 rounded-sm border transition",
                                (activeSticky.color || "#39ff14") === c ? "border-black ring-1 ring-black/30" : "border-slate-300"
                              )}
                              style={{ backgroundColor: c }}
                              aria-label="Set sticky colour"
                            />
                          ))}
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          )}

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
                    <p
                      className={cn(
                        "text-[8px] font-medium uppercase leading-none tracking-wide text-slate-400",
                        !editingDayCountdown && "cursor-pointer"
                      )}
                      onClick={!editingDayCountdown ? openDayCountdownEditor : undefined}
                    >
                      Days until
                    </p>
                    <div
                      className={cn("flex min-h-0 min-w-0 items-center", !editingDayCountdown && "cursor-pointer")}
                      onClick={!editingDayCountdown ? openDayCountdownEditor : undefined}
                    >
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
                          onClick={openDayCountdownEditor}
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
                  <div className="flex min-h-[3.75rem] w-full max-w-full shrink-0 flex-wrap items-center gap-2 rounded-[5px] border border-slate-300 bg-white/80 pl-2.5 pr-3 py-1 shadow-sm sm:w-max">
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
            </div>
          )}
        </div>

        {!focusMode && (
          <div className="mb-5 flex w-full flex-wrap items-center gap-1.5 pt-1 sm:gap-2">
            {viewMode === "day" ? (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                {(normalizedSearch ? filteredTimetable : timetable).map((day) => (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.day);
                      setViewMode("day");
                    }}
                    className={cn(
                      "w-[4.4rem] shrink-0 text-center rounded-[5px] border px-2.5 py-1.5 text-xs font-medium shadow-sm transition sm:w-20 sm:px-3 sm:py-2 sm:text-sm",
                      selectedDay === day.day
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            ) : null}

            {viewMode === "month" ? (
              <div className="flex items-center gap-1">
                {schoolDayRows.map((day) => (
                  <button
                    key={`month-day-${day.day}`}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.day);
                      setViewMode("day");
                    }}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm transition",
                      selectedDay === day.day
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                    title={day.day}
                    aria-label={`Open ${day.day}`}
                  >
                    {String(day.short ?? day.day).slice(0, 1)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-xs",
                  viewMode !== "month" ? "bg-slate-900 text-white" : "text-slate-600"
                )}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-xs",
                  viewMode === "month" ? "bg-slate-900 text-white" : "text-slate-600"
                )}
              >
                Month
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenUnitOutliner}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-xs"
            >
              Unit Outliner
            </button>
            <button
              type="button"
              onClick={onOpenStudentNotes}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-xs"
            >
              Student Notes
            </button>
            <button
              type="button"
              onClick={onOpenStudentLists}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-xs"
            >
              Student Lists
            </button>
            <button
              type="button"
              onClick={handleAddLesson}
              className="rounded-full bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 sm:px-3 sm:py-2 sm:text-xs"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Add Lesson
            </button>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:h-9 sm:w-9"
                title="Toggle Expand All"
              >
                <ChevronsUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden" style={{ zoom: fontScale }}>
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
          ) : visibleDays.length === 0 && !hasAnySearchResults ? (
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
                    focusMode && "p-3",
                    viewMode === "day" && "w-full md:w-1/2 md:justify-self-center"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {selectedWeekDateLabelsByDay?.[day.day] ?? ""}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900">{day.day}</h3>
                      {!focusMode && (
                        <p className="text-[11px] text-slate-500">
                          {day.items.filter((i) => i.type === "lesson" && lessonSlotHasPlan(i)).length} planned
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {viewMode === "day" ? (
                        <button
                          type="button"
                          onClick={() => setViewMode("week")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          title="Close day focus"
                          aria-label="Close day focus"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
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
                        className="rounded-md"
                        onDragOver={isDraggableEnabled ? handleDragOver : undefined}
                        onDrop={(e) => isDraggableEnabled && handleDrop(e, dayIndex, itemIndex)}
                      >
                        <div
                          draggable={isDraggableEnabled}
                          onDragStart={(e) => {
                            if (!isDraggableEnabled) return;
                            if (e.target.closest?.("input, textarea, button, select, a")) {
                              e.preventDefault();
                              return;
                            }
                            handleDragStart(e, dayIndex, itemIndex);
                          }}
                          className={cn(isDraggableEnabled && "cursor-grab active:cursor-grabbing")}
                        >
                          {item.type === "lesson" ? (
                            <LessonSlotRow
                              lesson={item}
                              dayName={day.day}
                              onOpenSlotDetail={openSlotLessonOverlay}
                              onOpenAddLessonForSlot={openAddLessonForSlot}
                              onOpenAccentPicker={openAccentPicker}
                              onOpenStudentNoteEntryForLesson={openStudentNoteEntryForLesson}
                              onLineNoteCommit={commitLessonLineNote}
                              onSlotNoteCommit={commitLessonSlotNote}
                              onLessonHeaderCommitAttempt={onLessonHeaderCommitAttempt}
                              subjectApplyPrompt={subjectApplyPrompt}
                              onOpenCalendarKind={(kind, title) =>
                                openCalendarFromLessonSlot(day.day, kind, title)
                              }
                              insertCellsAtAnchor={insertCellsAtAnchor}
                              removeCellsAtAnchor={removeCellsAtAnchor}
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
                              dayName={day.day}
                              insertCellsAtAnchor={insertCellsAtAnchor}
                              removeCellsAtAnchor={removeCellsAtAnchor}
                              editingField={editingField}
                              editingValue={editingValue}
                              onStartEdit={startInlineEdit}
                              onEditChange={setEditingValue}
                              onEditSave={saveInlineEdit}
                              onEditCancel={cancelInlineEdit}
                            />
                          )}
                        </div>
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
              const overlayDayName = overlayLesson
                ? findLessonDayNameInTimetable(timetable, slotOverlayLessonId)
                : null;
              return overlayLesson
                ? createPortal(
                    <SlotLessonDetailOverlay
                      key={slotOverlayLessonId}
                      lesson={overlayLesson}
                      dayName={overlayDayName}
                      unitStore={unitStore}
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
