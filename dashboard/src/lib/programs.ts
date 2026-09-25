export type ProgramStatus = "Active" | "Draft" | "Archived" | "Planning";

export interface Cohort {
  id: string;
  learners: number;
}

export interface Program {
  id: string;
  name: string;
  status: ProgramStatus;
  description: string;
  startDate: string;
  endDate: string;
  owner: string;
  createdDate: string;
  cohorts: Cohort[];
}

export const initialPrograms: Program[] = [
  {
    id: "p1",
    name: "ST3 Orthopaedics 2025",
    status: "Active",
    description:
      "Core orthopaedic residency simulation curriculum for ST3 trainees, covering primary TKR planning through to balancing and trialling.",
    startDate: "2025-01-06",
    endDate: "2025-12-19",
    owner: "Dr Neha Rao",
    createdDate: "2024-11-04",
    cohorts: [
      { id: "c1", learners: 6 },
      { id: "c2", learners: 7 },
      { id: "c3", learners: 0 },
    ],
  },
  {
    id: "p2",
    name: "Trauma & Fracture Fixation",
    status: "Active",
    description:
      "Advanced trauma simulation pathway covering peri-articular fracture fixation and staged reconstruction planning.",
    startDate: "2025-02-01",
    endDate: "2025-11-30",
    owner: "Dr Imran Sheikh",
    createdDate: "2024-12-12",
    cohorts: [
      { id: "c4", learners: 9 },
      { id: "c5", learners: 3 },
    ],
  },
  {
    id: "p3",
    name: "Arthroplasty Fellowship Pilot",
    status: "Archived",
    description:
      "Pilot simulation track for fellowship-level arthroplasty training, run as a closed two-batch pilot in 2024.",
    startDate: "2024-06-01",
    endDate: "2024-12-20",
    owner: "Dr Neha Rao",
    createdDate: "2024-04-18",
    cohorts: [
      { id: "c6", learners: 6 },
      { id: "c7", learners: 5 },
    ],
  },
];

let uidCounter = 1000;
export function uid(prefix: string) {
  uidCounter += 1;
  return prefix + uidCounter;
}

export function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function badgeClass(status: ProgramStatus) {
  return (
    { Active: "active", Draft: "draft", Archived: "archived", Planning: "planning" }[status] ||
    "draft"
  );
}

export const today = () => new Date().toISOString().slice(0, 10);
