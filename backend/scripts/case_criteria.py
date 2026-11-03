"""
The planning criteria every library case is scored against: shared by seed_case_library.py (which stores them
as each case version's `assessment_criteria`) and seed_sample_results.py (which scores sample plans with them
when it runs without a database).
"""

# (name, parameter, unit, tolerance, severity rule)
DEG = "°"
CRITERIA = [
    ("Mechanical Axis Deviation (MAD)", "MAD_mm", "mm", 2.0, {"minor": 2.0, "major": 4.0, "critical": 6.0}),
    ("Mechanical HKA Angle", "mHKA_deg", DEG, 1.5, {"minor": 1.5, "major": 3.0, "critical": 5.0}),
    ("Medial Proximal Tibial Angle", "MPTA_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
    ("Mechanical Lateral Distal Femoral Angle", "LDFA_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
    ("Posterior Tibial Slope", "PTS_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
]
SIZE_CRITERIA = [
    ("Tibial Component Sizing", "tibial_size"),
    ("Femoral Component Sizing", "femoral_size"),
]
