# VR Integration

## Principle

The VR client is the execution layer. The backend is authoritative for case configuration, assessment configuration, assessment results and persisted attempt state.

## Flow

```text
VR connects
-> authenticate
-> receive case/session context
-> create attempt
-> stream events
-> persist checkpoints
-> complete
-> assess
-> result
```

## Event envelope

```json
{
  "attempt_id": "uuid",
  "sequence_number": 123,
  "timestamp": "ISO-8601",
  "procedure_step_id": "uuid",
  "event_type": "cut_completed",
  "parameter_name": "tibial_angle",
  "planned_value": 3.0,
  "actual_value": 6.0,
  "unit": "deg",
  "metadata": {}
}
```

## Reliability

VR should support:
- local unsent queue
- monotonically increasing sequence numbers
- retries
- idempotent ingestion
- acknowledgment-gap detection
- reconnect recovery

## Attempt states

Recommended:
```text
created
in_progress
paused
completed
submitted
assessed
failed
cancelled
```

Centralize state transitions on the backend.

## Plan transfer & V1 VR Payload Schema

A locked preoperative plan produces an immutable snapshot. The attempt references the exact version consumed by VR.

Under the authoritative V1 specification (`Mediver User Planning Workflow V1.pdf`, Pages 6–7), the sealed VR transfer payload has the following exact schema:

```json
{
  "patient_id": "P-0247",
  "knee_side": "RIGHT",
  "assessment": {
    "MAD_mm": 12.0,
    "AMA_deg": 6.0,
    "mHKA_deg": 7.0,
    "MPTA_deg": 89.0,
    "LDFA_deg": 88.0,
    "PTS_deg": 7.0
  },
  "tibial_component": {
    "implant_size": 3,
    "position_2d": {
      "x_offset_mm": 1.2,
      "y_offset_mm": -0.4,
      "rotation_deg": 0.5
    }
  },
  "femoral_component": {
    "implant_size": 4,
    "position_2d": {
      "x_offset_mm": 0.5,
      "y_offset_mm": 0.0,
      "rotation_deg": 0.0
    }
  }
}
```

Once sealed, the 2D planning workspace becomes read-only and immutable. Intraoperative resection parameters (depths, cuts, gap balancing) are executed in the VR environment.

## Client authority boundary

VR should not decide final score, pass/fail, critical-error status, competency, or recommendation.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed handoff boundary

VR remains a separate execution module. The pre-operative planning system produces a locked plan and transfers it through the existing VR contract.

The VR workflow itself is unchanged by this update and remains governed by the prior procedure-step and event architecture.

After the VR attempt is completed, the application returns to MediVeR for the post-operative review. Both resident and instructor can view the result, and instructor feedback can be attached to specific errors or procedure steps.
