import React, { useEffect, useMemo, useState } from "react";
import { cn } from "./utils/cn.js";

const FIXED_NAME_COL_ID = "studentName";
const FIXED_NOTES_COL_ID = "notes";

function nameKey(v) {
  return String(v ?? "").trim().toLowerCase();
}

export function StudentListsPanel({
  open,
  onClose,
  classLabels,
  studentLists,
  onEnsureClassTable,
  onUpdateClassTable,
  studentNotes,
  onOpenStudentNotesForStudent,
  onExportClassCsv,
  onExportAllCsv,
}) {
  const [activeClass, setActiveClass] = useState("");
  const classTabs = Array.isArray(classLabels) ? classLabels : [];

  useEffect(() => {
    if (!open) return;
    if (!classTabs.length) {
      setActiveClass("");
      return;
    }
    setActiveClass((prev) => (classTabs.includes(prev) ? prev : classTabs[0]));
  }, [open, classTabs]);

  useEffect(() => {
    if (!open || !activeClass) return;
    onEnsureClassTable(activeClass);
  }, [open, activeClass, onEnsureClassTable]);

  const activeTable = activeClass ? studentLists?.byClass?.[activeClass] : null;
  const editableColumns = useMemo(
    () => (activeTable?.columns ?? []).filter((c) => c.id !== FIXED_NAME_COL_ID && c.id !== FIXED_NOTES_COL_ID),
    [activeTable]
  );

  const notesCountByStudent = useMemo(() => {
    const out = new Map();
    if (!activeClass || !Array.isArray(studentNotes)) return out;
    const activeClassKey = nameKey(activeClass);
    for (const note of studentNotes) {
      if (nameKey(note.classLabel) !== activeClassKey) continue;
      const k = nameKey(note.studentName);
      if (!k) continue;
      out.set(k, (out.get(k) ?? 0) + 1);
    }
    return out;
  }, [activeClass, studentNotes]);
  const totalColumnCount = 2 + editableColumns.length;
  const shouldUseHorizontalScroll = totalColumnCount >= 8;
  const nameColWidthRem = 7.2; // 25% narrower again from 9.6rem.
  const notesColWidthRem = 3.5;
  const editableColWidthRem =
    totalColumnCount <= 6 ? 4.5 : totalColumnCount === 7 ? 3.9 : 3.25;
  const actionColWidthRem = 2;
  const tableMinWidthRem =
    nameColWidthRem +
    notesColWidthRem +
    editableColumns.length * editableColWidthRem +
    actionColWidthRem;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-slate-900/25" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 top-6 z-[71] flex max-h-[min(90vh,44rem)] min-h-[22rem] min-w-[26rem] w-[min(calc(100%-1rem),62rem)] -translate-x-1/2 flex-col overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] [resize:both]"
        role="dialog"
        aria-labelledby="student-lists-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/90 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tracking</p>
            <h2 id="student-lists-title" className="text-base font-semibold text-slate-900">
              Student Lists
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close student lists"
          >
            ×
          </button>
        </div>

        <div className="border-b border-slate-100 px-3 py-2">
          {classTabs.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {classTabs.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveClass(label)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm transition",
                    activeClass === label
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">No class labels in timetable yet. Add classes first.</p>
          )}
        </div>

        {activeClass && activeTable ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500">{activeClass}</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onExportClassCsv?.(activeClass)}
                  className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  title="Export this class list as CSV"
                >
                  Export Class CSV
                </button>
                <button
                  type="button"
                  onClick={() => onExportAllCsv?.()}
                  className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  title="Export all class lists as CSV"
                >
                  Export All CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateClassTable(activeClass, (table) => ({
                      ...table,
                      rows: [
                        ...table.rows,
                        {
                          id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                          name: "",
                          cells: Object.fromEntries(
                            table.columns
                              .filter((c) => c.id !== FIXED_NAME_COL_ID && c.id !== FIXED_NOTES_COL_ID)
                              .map((c) => [c.id, ""])
                          ),
                        },
                      ],
                    }))
                  }
                  className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  + Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editableColumns.length >= 24) return;
                    const newColId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
                    onUpdateClassTable(activeClass, (table) => ({
                      ...table,
                      columns: [
                        ...table.columns,
                        {
                          id: newColId,
                          label: `C${table.columns.filter((c) => c.id !== FIXED_NAME_COL_ID && c.id !== FIXED_NOTES_COL_ID).length + 1}`,
                          kind: "editable",
                        },
                      ],
                      rows: table.rows.map((row) => ({
                        ...row,
                        cells: { ...row.cells, [newColId]: "" },
                      })),
                    }));
                  }}
                  className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={editableColumns.length >= 24}
                >
                  + Column
                </button>
              </div>
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto p-2",
                shouldUseHorizontalScroll && "overflow-x-auto"
              )}
            >
              <table
                className="table-fixed border-separate border-spacing-0"
                style={{
                  minWidth: `${tableMinWidthRem}rem`,
                  width: shouldUseHorizontalScroll ? `${tableMinWidthRem}rem` : "100%",
                }}
              >
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 z-10 border-b border-slate-200 bg-white px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                      style={{ width: `${nameColWidthRem}rem` }}
                    >
                      Student Name
                    </th>
                    <th
                      className="border-b border-slate-200 bg-white px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                      style={{ width: `${notesColWidthRem}rem` }}
                    >
                      Notes
                    </th>
                    {editableColumns.map((col) => (
                      <th
                        key={col.id}
                        className="border-b border-slate-200 bg-white px-1 py-1 text-center"
                        style={{ width: `${editableColWidthRem}rem` }}
                      >
                        <div className="flex items-center gap-1">
                          <input
                            value={col.label}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            onChange={(e) => {
                              const nextLabel = e.target.value.slice(0, 24);
                              onUpdateClassTable(activeClass, (table) => ({
                                ...table,
                                columns: table.columns.map((c) =>
                                  c.id === col.id ? { ...c, label: nextLabel } : c
                                ),
                              }));
                            }}
                            className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-semibold text-slate-700 outline-none focus:border-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateClassTable(activeClass, (table) => ({
                                ...table,
                                columns: table.columns.filter((c) => c.id !== col.id),
                                rows: table.rows.map((row) => {
                                  const nextCells = { ...row.cells };
                                  delete nextCells[col.id];
                                  return { ...row, cells: nextCells };
                                }),
                              }))
                            }
                            className="rounded px-1 text-[11px] text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${col.label} column`}
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}
                    <th
                      className="border-b border-slate-200 bg-white"
                      style={{ width: `${actionColWidthRem}rem` }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {activeTable.rows.map((row) => {
                    const notesCount = notesCountByStudent.get(nameKey(row.name)) ?? 0;
                    return (
                      <tr key={row.id}>
                        <td className="sticky left-0 z-[1] border-b border-slate-100 bg-white px-2 py-1">
                          <input
                            value={row.name}
                            onChange={(e) =>
                              onUpdateClassTable(activeClass, (table) => ({
                                ...table,
                                rows: table.rows.map((r) =>
                                  r.id === row.id ? { ...r, name: e.target.value.slice(0, 120) } : r
                                ),
                              }))
                            }
                            placeholder="Student name"
                            className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[12px] text-slate-900 outline-none focus:border-slate-300"
                          />
                        </td>
                        <td className="border-b border-slate-100 px-1 py-1 text-center">
                          <button
                            type="button"
                            disabled={!notesCount || !row.name.trim()}
                            onClick={() => onOpenStudentNotesForStudent?.(row.name.trim(), activeClass)}
                            className={cn(
                              "inline-flex min-w-[1.75rem] items-center justify-center rounded border px-1 py-0.5 text-[11px] font-semibold",
                              notesCount
                                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            )}
                          >
                            {notesCount}
                          </button>
                        </td>
                        {editableColumns.map((col) => (
                          <td key={`${row.id}-${col.id}`} className="border-b border-slate-100 px-1 py-1">
                            <input
                              value={String(row.cells?.[col.id] ?? "")}
                              onChange={(e) =>
                                onUpdateClassTable(activeClass, (table) => ({
                                  ...table,
                                  rows: table.rows.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          cells: { ...(r.cells ?? {}), [col.id]: e.target.value.slice(0, 40) },
                                        }
                                      : r
                                  ),
                                }))
                              }
                              className="w-full rounded border border-slate-200 bg-white px-1 py-1 text-center text-[12px] text-slate-900 outline-none focus:border-slate-300"
                            />
                          </td>
                        ))}
                        <td className="border-b border-slate-100 px-1 py-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateClassTable(activeClass, (table) => ({
                                ...table,
                                rows:
                                  table.rows.length <= 1
                                    ? table.rows
                                    : table.rows.filter((r) => r.id !== row.id),
                              }))
                            }
                            className="rounded px-1 text-[11px] text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove row"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex min-h-[12rem] items-center justify-center p-4 text-[11px] text-slate-500">
            Select a class to view its list.
          </div>
        )}
      </div>
    </>
  );
}
