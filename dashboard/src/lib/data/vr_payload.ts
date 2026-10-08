/**
 * The V1 VR transfer payload (PDF p.6-7). One builder, used by the lock action and the review screen,
 * so the JSON the surgeon is shown is the JSON that is sealed.
 *
 * The shape is the contract: exactly these keys, nothing about bone cuts, resections, gap balancing,
 * soft tissue or any other intra-operative value. Internal geometry metadata must NOT be added here.
 */

import type { V1Assessment, V1FemoralComponent, V1TibialComponent, V1VrPayload } from "@/lib/plan";

export function buildV1VrPayload(input: {
  patientId: string;
  kneeSide: "RIGHT" | "LEFT";
  assessment: V1Assessment;
  tibial: Pick<V1TibialComponent, "implant_size" | "position_2d">;
  femoral: Pick<V1FemoralComponent, "implant_size" | "position_2d">;
}): V1VrPayload {
  const { assessment: a, tibial: t, femoral: f } = input;
  return {
    patient_id: input.patientId,
    knee_side: input.kneeSide,
    assessment: {
      MAD_mm: a.MAD_mm,
      AMA_deg: a.AMA_deg,
      mHKA_deg: a.mHKA_deg,
      MPTA_deg: a.MPTA_deg,
      LDFA_deg: a.LDFA_deg,
      PTS_deg: a.PTS_deg,
    },
    tibial_component: {
      implant_size: t.implant_size,
      position_2d: {
        x_offset_mm: t.position_2d.x_offset_mm,
        y_offset_mm: t.position_2d.y_offset_mm,
        rotation_deg: t.position_2d.rotation_deg,
      },
    },
    femoral_component: {
      implant_size: f.implant_size,
      position_2d: {
        x_offset_mm: f.position_2d.x_offset_mm,
        y_offset_mm: f.position_2d.y_offset_mm,
        rotation_deg: f.position_2d.rotation_deg,
      },
    },
  };
}
