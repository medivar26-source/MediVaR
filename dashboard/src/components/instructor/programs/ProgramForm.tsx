"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Program, ProgramStatus } from "@/lib/programs";

export type ProgramFormValues = Pick<
  Program,
  "name" | "description" | "startDate" | "endDate" | "owner"
> & { status: ProgramStatus };

export default function ProgramForm({
  program,
  onSubmit,
  onClose,
}: {
  program: Program | null;
  onSubmit: (v: ProgramFormValues) => void;
  onClose: () => void;
}) {
  const editing = !!program;
  const [v, setV] = useState<ProgramFormValues>({
    name: program?.name ?? "",
    description: program?.description ?? "",
    startDate: program?.startDate ?? "",
    endDate: program?.endDate ?? "",
    owner: program?.owner ?? "",
    status: program?.status ?? "Draft",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const set = <K extends keyof ProgramFormValues>(k: K, val: ProgramFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...v, name: v.name.trim(), description: v.description.trim(), owner: v.owner.trim() };
    const errs = {
      name: !clean.name,
      startDate: !clean.startDate,
      endDate: !clean.endDate || (!!clean.startDate && clean.endDate < clean.startDate),
      owner: !clean.owner,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    onSubmit(clean);
  };

  const cls = (k: string) => "field" + (errors[k] ? " invalid" : "");

  return (
    <Modal title={editing ? "Edit program" : "Create Program"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          <div className={cls("name")}>
            <label>Program name</label>
            <input type="text" value={v.name} placeholder="e.g. ST3 Orthopaedics 2026" onChange={(e) => set("name", e.target.value)} />
            <div className="field-err">Program name is required.</div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={v.description} placeholder="What does this program cover?" onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field-row">
            <div className={cls("startDate")}>
              <label>Start date</label>
              <input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
              <div className="field-err">Start date is required.</div>
            </div>
            <div className={cls("endDate")}>
              <label>End date</label>
              <input type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
              <div className="field-err">End date must be after start date.</div>
            </div>
          </div>
          <div className={cls("owner")}>
            <label>Owner / Coordinator</label>
            <input type="text" value={v.owner} placeholder="e.g. Dr Neha Rao" onChange={(e) => set("owner", e.target.value)} />
            <div className="field-err">Owner is required.</div>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={v.status} onChange={(e) => set("status", e.target.value as ProgramStatus)}>
              {["Draft", "Active", "Archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{editing ? "Save changes" : "Create Program"}</button>
        </div>
      </form>
    </Modal>
  );
}
