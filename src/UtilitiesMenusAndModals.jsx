import React from "react";
import { cn } from "./utils/cn.js";

/**
 * Utilities dropdown, Clear Week submenu, week clear / archive / export-import / duplicate-week dialogs.
 * State and handlers are owned by App; this file is presentational only.
 */
export function UtilitiesMenusAndModals({
  studioFloatingAnchorClass,
  components: { ArchiveBox, X },
  utilitiesMenuOpen,
  utilitiesMenuRef,
  closeUtilitiesMenu,
  openDuplicateWeekFromUtilities,
  openNewWeekSubmenuFromUtilities,
  onOpenUnitPlannerFromUtilities,
  onOpenViewUnitsFromUtilities,
  onOpenWeekDatesFromUtilities,
  onOpenStudentNotesFromUtilities,
  onOpenLessonExportFromUtilities,
  handleUtilityExportFile,
  openUtilityImportModal,
  openArchiveModalFromUtilities,
  weekToolsMenuOpen,
  weekToolsMenuRef,
  closeWeekToolsMenu,
  openWeekClearConfirm,
  readWeekTemplateFromStorage,
  weekClearConfirm,
  weekClearDialogRef,
  cancelWeekClear,
  setWeekClearConfirm,
  selectedWeek,
  termWeeks,
  weekdayOrder,
  confirmWeekClearAction,
  archiveModalOpen,
  closeArchiveModal,
  archiveDraftLabel,
  setArchiveDraftLabel,
  archiveSaveConfirm,
  setArchiveSaveConfirm,
  finalizeCreateTeacherStudioArchive,
  teacherStudioArchives,
  setArchiveRestoreConfirm,
  deleteTeacherStudioArchive,
  archiveRestoreConfirm,
  applyTeacherStudioArchiveSnapshot,
  utilityExportModalOpen,
  closeUtilityExportModal,
  utilityImportModalOpen,
  closeUtilityImportModal,
  utilityImportInputRef,
  onUtilityImportFileSelected,
  utilityImportReplaceConfirm,
  setUtilityImportReplaceConfirm,
  confirmUtilityImportReplace,
  duplicateWeekDialog,
  duplicateWeekDialogRef,
  cancelDuplicateWeek,
  setDuplicateWeekDialog,
  confirmDuplicateWeek,
  startNewTermModalOpen,
  startNewTermChoice,
  setStartNewTermChoice,
  openStartNewTermFromUtilities,
  cancelStartNewTermModal,
  confirmStartNewTerm,
}) {
  return (
    <>
      {utilitiesMenuOpen ? (
      <>
        <div
          className="absolute inset-0 z-[45] bg-slate-900/20"
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            closeUtilitiesMenu();
          }}
        />
        <div
          ref={utilitiesMenuRef}
          role="menu"
          aria-label="Utilities"
          className={cn(
            studioFloatingAnchorClass,
            "z-[46] flex w-[15rem] max-h-[min(88vh,40rem)] flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => {
              openDuplicateWeekFromUtilities();
            }}
          >
            Duplicate Week
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={openNewWeekSubmenuFromUtilities}
          >
            Clear Week
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={onOpenUnitPlannerFromUtilities}
          >
            Unit Outliner
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={onOpenViewUnitsFromUtilities}
          >
            View Units
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={onOpenWeekDatesFromUtilities}
          >
            Lock Week Dates
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={onOpenStudentNotesFromUtilities}
          >
            See Student Notes
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={onOpenLessonExportFromUtilities}
          >
            Share / Export Lessons
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={openStartNewTermFromUtilities}
          >
            Start New Term…
          </button>
          <div className="my-1 border-t border-slate-200" role="separator" />
          <div className="px-3 pb-0.5 pt-1">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Advanced</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={handleUtilityExportFile}
          >
            Export File
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={openUtilityImportModal}
          >
            Import File
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-slate-500 transition hover:bg-slate-50"
            onClick={openArchiveModalFromUtilities}
          >
            <ArchiveBox className="h-3.5 w-3.5 shrink-0 opacity-70" />
            Archive (Advanced)
          </button>
        </div>
      </>
    ) : null}

    {weekToolsMenuOpen ? (
      <>
        <div
          className="absolute inset-0 z-[45] bg-slate-900/20"
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            closeWeekToolsMenu();
          }}
        />
        <div
          ref={weekToolsMenuRef}
          role="menu"
          aria-label="Clear week options"
          className={cn(
            studioFloatingAnchorClass,
            "z-[46] flex w-[13.75rem] max-h-[min(88vh,40rem)] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => openWeekClearConfirm("notes")}
          >
            Clear notes…
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => openWeekClearConfirm("lessons")}
          >
            Clear lessons…
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => openWeekClearConfirm("all")}
          >
            Clear everything…
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!readWeekTemplateFromStorage()}
            className={cn(
              "flex w-full px-3 py-2 text-left text-[12.5px] font-medium transition",
              readWeekTemplateFromStorage()
                ? "text-slate-800 hover:bg-slate-50"
                : "cursor-not-allowed text-slate-400"
            )}
            onClick={() => {
              if (!readWeekTemplateFromStorage()) return;
              openWeekClearConfirm("load");
            }}
          >
            Load saved week…
          </button>
        </div>
      </>
    ) : null}

    {weekClearConfirm ? (
      <>
        <div
          className="absolute inset-0 z-[47] bg-slate-900/25"
          aria-hidden
          onClick={cancelWeekClear}
        />
        <div
          ref={weekClearDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="week-clear-title"
          className={cn(
            studioFloatingAnchorClass,
            "z-[48] w-[min(100%-1.25rem,16.5rem)] max-h-[min(72vh,22rem)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <p id="week-clear-title" className="text-xs font-semibold text-slate-900">
            {weekClearConfirm.kind === "notes" && "Clear notes"}
            {weekClearConfirm.kind === "lessons" && "Clear lessons"}
            {weekClearConfirm.kind === "all" && "Clear everything"}
            {weekClearConfirm.kind === "load" && "Load saved week"}
          </p>
          <p className="mt-1 text-[10px] leading-snug text-slate-500">
            {weekClearConfirm.kind === "notes" &&
              (weekClearConfirm.weekScope === "allWeeks"
                ? "Remove slot notes and one-line notes for the days you choose, on every week in the term (Week 1–11)."
                : "Remove slot notes and one-line notes for the days you choose on the selected week only.")}
            {weekClearConfirm.kind === "lessons" &&
              (weekClearConfirm.weekScope === "allWeeks"
                ? "Reset lesson slots to the default scaffold for those days on every week in the term."
                : "Reset lesson slots to the default timetable scaffold (subjects, rooms, times) for this week only.")}
            {weekClearConfirm.kind === "all" &&
              (weekClearConfirm.weekScope === "allWeeks"
                ? "Clear notes and reset lessons to the default scaffold for those days on every week in the term."
                : "Clear all notes and reset lessons to the default scaffold for those days on this week only.")}
            {weekClearConfirm.kind === "load" &&
              (weekClearConfirm.weekScope === "allWeeks"
                ? "Replace lessons and duties on chosen days using your saved template, for every week in the term."
                : "Replace lessons and duties on chosen days with your saved week template.")}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Which weeks
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-800">
              <input
                type="radio"
                name="week-clear-which-weeks"
                className="h-3 w-3 accent-slate-800"
                checked={weekClearConfirm.weekScope === "thisWeek"}
                onChange={() =>
                  setWeekClearConfirm((c) => (c ? { ...c, weekScope: "thisWeek" } : c))
                }
              />
              This week only ({selectedWeek})
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-800">
              <input
                type="radio"
                name="week-clear-which-weeks"
                className="h-3 w-3 accent-slate-800"
                checked={weekClearConfirm.weekScope === "allWeeks"}
                onChange={() =>
                  setWeekClearConfirm((c) => (c ? { ...c, weekScope: "allWeeks" } : c))
                }
              />
              All term weeks ({termWeeks[0]}–{termWeeks[termWeeks.length - 1]})
            </label>
          </div>
          <div className="mt-2 space-y-1">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-800">
              <input
                type="radio"
                name="week-clear-scope"
                className="h-3 w-3 accent-slate-800"
                checked={weekClearConfirm.mode === "whole"}
                onChange={() =>
                  setWeekClearConfirm((c) => (c ? { ...c, mode: "whole" } : c))
                }
              />
              Whole week (Mon–Fri)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-800">
              <input
                type="radio"
                name="week-clear-scope"
                className="h-3 w-3 accent-slate-800"
                checked={weekClearConfirm.mode === "pick"}
                onChange={() =>
                  setWeekClearConfirm((c) => (c ? { ...c, mode: "pick" } : c))
                }
              />
              Selected days
            </label>
          </div>
          {weekClearConfirm.mode === "pick" ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {weekdayOrder.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    setWeekClearConfirm((c) =>
                      c ? { ...c, pick: { ...c.pick, [d]: !c.pick[d] } } : c
                    )
                  }
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-semibold transition",
                    weekClearConfirm.pick[d]
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {d === "Wednesday" ? "Wed" : d.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={cancelWeekClear}
              className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                weekClearConfirm.mode === "pick" &&
                !weekdayOrder.some((d) => weekClearConfirm.pick[d])
              }
              onClick={confirmWeekClearAction}
              className="flex-1 rounded-lg bg-slate-800 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      </>
    ) : null}

    {archiveModalOpen ? (
      <>
        <div
          className="absolute inset-0 z-[49] bg-slate-900/25"
          aria-hidden
          onClick={closeArchiveModal}
        />
        <div className="pointer-events-none absolute inset-0 z-[50] flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-advanced-title"
            className="pointer-events-auto relative max-h-[min(90vh,28rem)] w-[min(calc(100%-1.5rem),22rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="max-h-[min(90vh,28rem)] overflow-y-auto px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p id="archive-advanced-title" className="text-sm font-semibold text-slate-900">
                  Archive (Advanced)
                </p>
                <p className="mt-1 text-[10px] leading-snug text-slate-500">
                  Optional snapshots stored in this browser only. Not part of your normal workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={closeArchiveModal}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close archive dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-3 block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Label (optional)
            </label>
            <input
              type="text"
              value={archiveDraftLabel}
              onChange={(e) => setArchiveDraftLabel(e.target.value)}
              placeholder="e.g. Before term 2 shuffle"
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
            />

            {archiveSaveConfirm ? (
              <div className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-2">
                <p className="text-[10px] font-medium leading-snug text-amber-950">
                  Save a snapshot of your timetable, all week overlays, settings, saved week template, and unit
                  planner data in this browser?
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setArchiveSaveConfirm(false)}
                    className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={finalizeCreateTeacherStudioArchive}
                    className="flex-1 rounded-lg bg-slate-800 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-900"
                  >
                    Confirm archive
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setArchiveSaveConfirm(true)}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Create archive…
              </button>
            )}

            <p className="mt-4 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Saved archives
            </p>
            {teacherStudioArchives.length === 0 ? (
              <p className="mt-1.5 text-[10px] text-slate-500">No archives yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {teacherStudioArchives.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-slate-800">{a.label}</p>
                        <p className="text-[9px] text-slate-500">
                          {(() => {
                            try {
                              return new Date(a.createdAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              });
                            } catch {
                              return a.createdAt;
                            }
                          })()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setArchiveRestoreConfirm({ id: a.id, label: a.label })
                          }
                          className="rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTeacherStudioArchive(a.id)}
                          className="rounded-md px-2 py-1 text-[9px] font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {archiveRestoreConfirm ? (
            <>
              <div
                className="absolute inset-0 z-[10] bg-slate-900/40"
                aria-hidden
                onClick={() => setArchiveRestoreConfirm(null)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="archive-restore-title"
                className="absolute left-1/2 top-1/2 z-[11] w-[min(calc(100%-2rem),18rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p id="archive-restore-title" className="text-xs font-semibold text-slate-900">
                  Restore archive?
                </p>
                <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
                  Replace all current app data with{" "}
                  <span className="font-semibold text-slate-800">{archiveRestoreConfirm.label}</span>. The page
                  will reload. Create a new archive first if you need a backup of today&apos;s data.
                </p>
                <div className="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setArchiveRestoreConfirm(null)}
                    className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const entry = teacherStudioArchives.find((x) => x.id === archiveRestoreConfirm.id);
                      if (!entry) {
                        setArchiveRestoreConfirm(null);
                        return;
                      }
                      applyTeacherStudioArchiveSnapshot(entry.snapshot);
                    }}
                    className="flex-1 rounded-lg bg-amber-700 py-1.5 text-[10px] font-semibold text-white transition hover:bg-amber-800"
                  >
                    Restore &amp; reload
                  </button>
                </div>
              </div>
            </>
          ) : null}
          </div>
        </div>
      </>
    ) : null}

    {utilityExportModalOpen ? (
      <>
        <div
          className="absolute inset-0 z-[49] bg-slate-900/25"
          aria-hidden
          onClick={closeUtilityExportModal}
        />
        <div className="pointer-events-none absolute inset-0 z-[50] flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="utility-export-title"
            className="pointer-events-auto w-[min(calc(100%-1.5rem),20rem)] rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="utility-export-title" className="text-sm font-semibold text-slate-900">
              Backup saved
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
              A file with your full timetable (every week), notes, and settings was saved to this device—often
              your Downloads folder.
            </p>
            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              File downloaded
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] leading-snug text-slate-800">
              <li>Find it in your downloads folder</li>
              <li>Email it to yourself</li>
            </ol>
            <button
              type="button"
              onClick={closeUtilityExportModal}
              className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-900"
            >
              OK
            </button>
          </div>
        </div>
      </>
    ) : null}

    {utilityImportModalOpen ? (
      <>
        <div
          className="absolute inset-0 z-[49] bg-slate-900/25"
          aria-hidden
          onClick={closeUtilityImportModal}
        />
        <div className="pointer-events-none absolute inset-0 z-[50] flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="utility-import-title"
            className="pointer-events-auto relative max-h-[min(88vh,26rem)] w-[min(calc(100%-1.5rem),20rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[min(88vh,26rem)] overflow-y-auto px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p id="utility-import-title" className="text-sm font-semibold text-slate-900">
                  Import backup
                </p>
                <button
                  type="button"
                  onClick={closeUtilityImportModal}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close import dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                How to import
              </p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] leading-snug text-slate-800">
                <li>Open your email</li>
                <li>Download the file attachment</li>
                <li>Open Teacher Studio</li>
                <li>Click Utilities</li>
                <li>Click Import File</li>
                <li>Select the downloaded file</li>
              </ol>
              <input
                ref={utilityImportInputRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                aria-hidden
                onChange={onUtilityImportFileSelected}
              />
              <button
                type="button"
                onClick={() => utilityImportInputRef.current?.click()}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Select my file
              </button>
            </div>

            {utilityImportReplaceConfirm ? (
              <>
                <div
                  className="absolute inset-0 z-[10] bg-slate-900/40"
                  aria-hidden
                  onClick={() => setUtilityImportReplaceConfirm(null)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="utility-import-confirm-title"
                  className="absolute left-1/2 top-1/2 z-[11] w-[min(calc(100%-2rem),17rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p id="utility-import-confirm-title" className="text-xs font-semibold text-slate-900">
                    Replace your data?
                  </p>
                  <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
                    This will replace your current data. Continue?
                  </p>
                  <div className="mt-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUtilityImportReplaceConfirm(null)}
                      className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmUtilityImportReplace}
                      className="flex-1 rounded-lg bg-slate-800 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-900"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </>
    ) : null}

    {startNewTermModalOpen ? (
      <>
        <div
          className="absolute inset-0 z-[49] bg-slate-900/25"
          aria-hidden
          onClick={cancelStartNewTermModal}
        />
        <div className="pointer-events-none absolute inset-0 z-[50] flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-new-term-title"
            className="pointer-events-auto max-h-[min(88vh,32rem)] w-[min(calc(100%-1.5rem),22rem)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="start-new-term-title" className="text-sm font-semibold text-slate-900">
              Start New Term
            </p>
            <p className="mt-2 text-[10px] leading-snug text-amber-900/90">
              This cannot be undone unless you have exported a backup.
            </p>
            <div className="mt-3 space-y-2">
              <label
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-2.5 py-2 transition",
                  startNewTermChoice === "fresh"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="start-new-term-option"
                    className="mt-0.5 h-3 w-3 accent-slate-800"
                    checked={startNewTermChoice === "fresh"}
                    onChange={() => setStartNewTermChoice("fresh")}
                  />
                  <span>
                    <span className="text-[12.5px] font-semibold text-slate-900">Fresh start (recommended)</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-600">
                      Clears lessons + notes. Keeps timetable structure.
                    </span>
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-2.5 py-2 transition",
                  startNewTermChoice === "keepUnits"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="start-new-term-option"
                    className="mt-0.5 h-3 w-3 accent-slate-800"
                    checked={startNewTermChoice === "keepUnits"}
                    onChange={() => setStartNewTermChoice("keepUnits")}
                  />
                  <span>
                    <span className="text-[12.5px] font-semibold text-slate-900">Keep structure + units</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-600">
                      Clears lessons + notes. Keeps timetable + unit planner.
                    </span>
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-2.5 py-2 transition",
                  startNewTermChoice === "full"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="start-new-term-option"
                    className="mt-0.5 h-3 w-3 accent-slate-800"
                    checked={startNewTermChoice === "full"}
                    onChange={() => setStartNewTermChoice("full")}
                  />
                  <span>
                    <span className="text-[12.5px] font-semibold text-slate-900">Full reset</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-600">
                      Clears everything (same as first-time use).
                    </span>
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-4 flex gap-1.5">
              <button
                type="button"
                onClick={cancelStartNewTermModal}
                className="flex-1 rounded-lg border border-slate-200/90 bg-white py-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStartNewTerm}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-900"
              >
                Start New Term
              </button>
            </div>
          </div>
        </div>
      </>
    ) : null}

    {duplicateWeekDialog ? (
      <>
        <div
          className="absolute inset-0 z-[47] bg-slate-900/25"
          aria-hidden
          onClick={cancelDuplicateWeek}
        />
        <div
          ref={duplicateWeekDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-week-title"
          className={cn(
            studioFloatingAnchorClass,
            "z-[48] w-[min(100%-1.25rem,16.5rem)] rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <p id="duplicate-week-title" className="text-xs font-semibold text-slate-900">
            Duplicate week
          </p>
          <p className="mt-1 text-[10px] leading-snug text-slate-500">
            Copy <span className="font-semibold text-slate-700">{selectedWeek}</span> (timetable, notes, and
            lesson data) into the week below. Existing data in the target week will be replaced.
          </p>
          <label className="mt-2 block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Target week
          </label>
          <select
            value={duplicateWeekDialog.targetWeek}
            onChange={(e) =>
              setDuplicateWeekDialog((d) => (d ? { ...d, targetWeek: e.target.value } : d))
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 outline-none"
            aria-label="Target week for duplicate"
          >
            {termWeeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={cancelDuplicateWeek}
              className="flex-1 rounded-lg border border-slate-200/90 bg-white py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDuplicateWeek}
              className="flex-1 rounded-lg bg-slate-800 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-900"
            >
              Copy &amp; replace
            </button>
          </div>
        </div>
      </>
    ) : null}
    </>
  );
}
