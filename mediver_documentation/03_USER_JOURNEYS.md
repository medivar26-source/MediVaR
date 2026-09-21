# User Journeys

## Instructor journey

```text
Login
-> Dashboard
-> Select Cohort
-> Inspect residents
-> Identify at-risk resident
-> Review resident profile
-> Inspect case history
-> Open attempt
-> Review plan vs execution
-> Inspect errors
-> Add feedback
-> Assign targeted training
-> Monitor next session
-> Review progression
```

## Program authoring journey

```text
Program
-> Curriculum
-> Cases
-> Procedures
-> Skills
-> Assessment rules
-> Cohort
-> Residents
-> Assignment
-> Session
```

## Resident journey

```text
Login
-> Assigned training
-> Select case
-> Case briefing
-> Select/enter mode
-> Start attempt
-> Follow procedure
-> Emit VR events
-> Complete
-> Submit
-> Assessment generated
-> Result shown according to policy
-> Progress updated
```

## Assessment journey

```text
Start attempt
-> capture raw events
-> normalize measurements
-> evaluate criteria
-> classify errors
-> calculate criterion results
-> calculate skill results
-> apply automatic-failure rules
-> calculate final score/result
-> persist immutable assessment snapshot
-> generate recommendation
-> update derived competency
```

## Review journey

```text
Dashboard alert
-> Resident
-> Case attempt
-> Error
-> Parameter deviation
-> Relevant step/event
-> Instructor feedback
```

## Confirmed Current Model Updates (2026-09-15)

## Confirmed Resident pre-operative and review journey

```text
Login
-> Dashboard
-> Assigned training / Cases / Sessions
-> Select case
-> Case briefing
-> Start / Continue / Retry
-> Pre-operative Planning (MEASURE → SIZE → SEND)
-> Assessment on interactive X-ray canvas (6 clinical measurements)
-> FLAP/KLAT toggle as required (0.264 mm/px calibration)
-> Confirm assessment measurements
-> Tibial Planning (Sizes 1-6, 2D CAD template overlay, coverage ≥ 90%, overhang ≤ 1.0mm)
-> Femoral Planning (Sizes 1-8, 2D CAD template overlay, notching risk verification)
-> Review & Send to VR (3-card summary inspection)
-> Lock / seal immutable V1 VR Payload
-> VR simulation
-> Return to MediVeR
-> Post-operative review
-> Compare plan vs execution
-> View mistakes / match percentage / results
-> Revisit instructor feedback before next practice
-> Practice again
```

## Confirmed Review interaction

```text
Attempt review
-> mistake/deviation
-> relevant step/event
-> instructor comment/correction
-> feedback saved
-> resident revisits feedback later
-> next practice attempt
``` 

The instructor journey and assessment journey remain the previously documented baseline outside these confirmed additions.
