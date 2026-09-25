"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import ProgramForm, { type ProgramFormValues } from "./ProgramForm";
import { useToast } from "./Toasts";
import { badgeClass, fmtDate, today, uid, type Program } from "@/lib/programs";
import { createProgram } from "@/app/actions";

type StatusFilter = "all" | "active" | "draft" | "archived";
type ModalState =
  | { type: "form"; programId: string | null }
  | { type: "delete"; programId: string }
  | null;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function ProgramsView({ initialPrograms }: { initialPrograms: Program[] }) {
  const toast = useToast();
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  // Close any open 3-dot menu on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".menu")) setOpenMenu(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(
    () =>
      programs.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || (p.name + " " + p.description).toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [programs, search, statusFilter]
  );

  const totalCohorts = programs.reduce((n, p) => n + p.cohorts.length, 0);
  const activeCount = programs.filter((p) => p.status === "Active").length;
  const closeModal = () => setModal(null);
  const find = (id: string | null) => programs.find((p) => p.id === id) ?? null;

  /* ---------- actions ---------- */

 const saveProgram = async (values: ProgramFormValues) => {
  if (modal?.type === "form" && modal.programId) {
    // Existing local edit behavior for now
    setPrograms((ps) =>
      ps.map((p) =>
        p.id === modal.programId ? { ...p, ...values } : p
      )
    );

    toast("Program updated");
    closeModal();
    return;
  }

  const formData = new FormData();
  formData.set("name", values.name);
  formData.set("description", values.description);

  const result = await createProgram({}, formData);

  if (result.error) {
    toast(result.error);
    return;
  }

  toast("Program created");
  closeModal();
};
  const duplicate = (p: Program) => {
    setPrograms((ps) => [
      ...ps,
      {
        ...p,
        id: uid("p"),
        name: p.name + " (copy)",
        status: "Draft",
        createdDate: today(),
        cohorts: p.cohorts.map((c) => ({ ...c, id: uid("c") })),
      },
    ]);
    toast("Program duplicated");
  };

  const toggleArchive = (p: Program) => {
    const next = p.status === "Archived" ? "Active" : "Archived";
    setPrograms((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    toast(next === "Archived" ? "Program archived" : "Program unarchived");
  };

  const remove = (id: string) => {
    setPrograms((ps) => ps.filter((p) => p.id !== id));
    closeModal();
    toast("Program deleted");
  };

  const menuAction = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu(null);
    fn();
  };

  const deleting = modal?.type === "delete" ? find(modal.programId) : null;

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Programs</h1>
          <p className="sub">
            {programs.length} programs · {activeCount} active · {totalCohorts} cohorts total
          </p>
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "form", programId: null })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Program
        </button>
      </div>

      <div className="toolbar">
        <div className="field-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grow" />
        <div className="seg">
          {(["all", "active", "draft", "archived"] as StatusFilter[]).map((s) => (
            <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid g3">
          {filtered.map((p) => {
            const learnerCount = p.cohorts.reduce((n, c) => n + c.learners, 0);
            const menuId = "menu-" + p.id;
            return (
              <div
                key={p.id}
                className="card clickable"
                onClick={() => toast("Program detail view is not included in this standalone page.")}
              >
                <div className="menu" style={{ position: "absolute", top: 16, right: 16 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="menu-btn"
                    type="button"
                    aria-label="Program actions"
                    onClick={() => setOpenMenu(openMenu === menuId ? null : menuId)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </button>
                  <div className={"menu-list" + (openMenu === menuId ? " open" : "")}>
                    <button onClick={menuAction(() => setModal({ type: "form", programId: p.id }))}>Edit details</button>
                    <button onClick={menuAction(() => duplicate(p))}>Duplicate</button>
                    <button onClick={menuAction(() => toggleArchive(p))}>
                      {p.status === "Archived" ? "Unarchive" : "Archive"}
                    </button>
                    <button className="danger" onClick={menuAction(() => setModal({ type: "delete", programId: p.id }))}>
                      Delete
                    </button>
                  </div>
                </div>

                <span className={"badge " + badgeClass(p.status)}>{p.status}</span>
                <h3 style={{ margin: "14px 0 6px", fontSize: 16, paddingRight: 24 }}>{p.name}</h3>
                <p className="tiny clamp2" style={{ marginBottom: 14, minHeight: 32 }}>
                  {p.description}
                </p>
                <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                  <span className="chip">{plural(p.cohorts.length, "cohort")}</span>{" "}
                  <span className="chip">{plural(learnerCount, "learner")}</span>
                </div>
                <div className="tiny">Created {fmtDate(p.createdDate)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <div className="ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </div>
          <div className="t">No programs match</div>
          <div className="d">Try a different search term or status filter, or create a new program to get started.</div>
          <button className="btn primary sm" onClick={() => setModal({ type: "form", programId: null })}>
            + Create Program
          </button>
        </div>
      )}

      {modal?.type === "form" && (
        <ProgramForm program={find(modal.programId)} onSubmit={saveProgram} onClose={closeModal} />
      )}

      {deleting && (
        <Modal title="Delete program" onClose={closeModal}>
          <div className="modal-body">
            {deleting.cohorts.length > 0 && (
              <div className="warn-box">
                This program has {plural(deleting.cohorts.length, "cohort")}. Deleting it will also delete{" "}
                {deleting.cohorts.length === 1 ? "that cohort" : "all of its cohorts"}, along with their case
                assignments and learner enrollments.
              </div>
            )}
            <p style={{ fontSize: 13.5, color: "var(--ink)" }}>
              Are you sure you want to delete <strong>{deleting.name}</strong>? This can&apos;t be undone.
            </p>
          </div>
          <div className="modal-foot">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn danger" onClick={() => remove(deleting.id)}>Delete program</button>
          </div>
        </Modal>
      )}
    </>
  );
}
