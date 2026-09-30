"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card } from "@/components/ui";
import { createPersonalCaseAction } from "@/app/actions/personal-cases";
import Link from "next/link";

export function NewPersonalCaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    pathology: "OA",
    pathology_label: "Osteoarthritis",
    side: "left",
    difficulty: "beginner",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createPersonalCaseAction({
        ...formData,
        patient: {},
        objectives: [],
      });
      if (!res.success) throw new Error(res.error || "Failed to create personal case");
      router.push(`/personal-cases/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create personal case");
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Input
          label="Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Varus Deformity left knee"
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

        {error && <div style={{ color: "red", fontSize: "0.875rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Creating..." : "Create Case"}
          </Button>
          <Link href="/personal-cases">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
