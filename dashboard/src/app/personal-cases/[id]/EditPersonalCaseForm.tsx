"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card } from "@/components/ui";
import { updatePersonalCaseAction, deletePersonalCaseAction, uploadPersonalRadiographAction } from "@/app/actions/personal-cases";
import { Trash, Upload, FileImage } from "lucide-react";

export function EditPersonalCaseForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const id = initialData.id;

  const [saving, setSaving] = useState(false);
  const [caseData, setCaseData] = useState<any>(initialData);

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    difficulty: initialData.difficulty || "beginner",
    side: initialData.side || "left",
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updatePersonalCaseAction(id, formData);
      if (!res.success) throw new Error(res.error);
      setCaseData(res.data);
      alert("Case updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this case?")) return;
    setSaving(true);
    try {
      const res = await deletePersonalCaseAction(id);
      if (!res.success) throw new Error(res.error);
      router.push("/personal-cases");
    } catch (err: any) {
      alert(err.message || "Failed to delete");
      setSaving(false);
    }
  };

  const handleUploadRadiograph = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("view_type", "FLAP");
    formDataObj.append("label", "Radiograph");
    formDataObj.append("marker_pixel_diameter", "100"); // Dummy/default value for personal case simplified upload
    formDataObj.append("marker_diameter_mm", "25.0");
    if (formData.side) formDataObj.append("laterality", formData.side);

    try {
      const res = await uploadPersonalRadiographAction(id, formDataObj);
      if (!res.success) throw new Error(res.error);
      setCaseData(res.data);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="danger" icon={Trash} onClick={handleDelete} disabled={saving}>
          Delete Case
        </Button>
      </div>

      <Card>
        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Difficulty"
            required
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </Select>
          <Select
            label="Side"
            value={formData.side}
            onChange={(e) => setFormData({ ...formData, side: e.target.value })}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </Select>
          
          <div style={{ marginTop: "1rem" }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Imaging">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {caseData.imaging && caseData.imaging.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {caseData.imaging.map((img: any) => (
                <li key={img.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
                  <FileImage size={24} />
                  <span>{img.label} ({img.view_type})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#666" }}>No imaging uploaded yet.</p>
          )}
          
          <div style={{ position: "relative", display: "inline-block" }}>
            <input 
              type="file" 
              accept="image/*,.dcm,.dcim"
              onChange={handleUploadRadiograph}
              disabled={saving}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
            <Button variant="secondary" icon={Upload} disabled={saving} tabIndex={-1}>
              Upload Radiograph
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
