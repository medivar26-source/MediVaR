import "./programs.css";
import ProgramsView from "@/components/instructor/programs/ProgramsView";
import { ToastProvider } from "@/components/instructor/programs/Toasts";
import { getPrograms } from "@/lib/data/programs";

export default async function ProgramsPage() {
  const rawPrograms = await getPrograms();
  const programs = rawPrograms.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status as any,
    description: p.description ?? "",
    startDate: "",
    endDate: "",
    owner: "",
    createdDate: p.created_at?.split('T')[0] ?? "",
    cohorts: [],
  }));
  return (
    <ToastProvider>
      <div className="canvas">
        <ProgramsView initialPrograms={programs} />
      </div>
    </ToastProvider>
  );
}