import json
from uuid import UUID
from typing import List, Optional, Dict, Any

from db.session import get_db_conn
from schemas.personal_cases import (
    LearnerPersonalCaseCreate,
    LearnerPersonalCaseUpdate,
    LearnerPersonalCaseDetail,
)

def get_learner_personal_cases(owner_user_id: UUID) -> List[Dict[str, Any]]:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, owner_user_id, title, pathology, pathology_label, side, difficulty, 
                    description, patient, objectives, created_at, updated_at
                FROM learner_personal_cases
                WHERE owner_user_id = %s
                ORDER BY created_at DESC
            """, (str(owner_user_id),))
            rows = cur.fetchall()
            return rows
    finally:
        conn.close()

def create_personal_case(owner_user_id: UUID, case_in: LearnerPersonalCaseCreate) -> Dict[str, Any]:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO learner_personal_cases (
                    owner_user_id, title, pathology, pathology_label, side, difficulty, 
                    description, patient, objectives
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                str(owner_user_id),
                case_in.title,
                case_in.pathology,
                case_in.pathology_label,
                case_in.side,
                case_in.difficulty,
                case_in.description,
                json.dumps(case_in.patient),
                json.dumps(case_in.objectives),
            ))
            case_id = cur.fetchone()["id"]
            conn.commit()
            return get_personal_case_detail(case_id, owner_user_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_personal_case_detail(case_id: UUID, owner_user_id: UUID) -> Optional[Dict[str, Any]]:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, owner_user_id, title, pathology, pathology_label, side, difficulty, 
                    description, patient, objectives, created_at, updated_at
                FROM learner_personal_cases
                WHERE id = %s AND owner_user_id = %s
            """, (str(case_id), str(owner_user_id)))
            row = cur.fetchone()
            if not row:
                return None
            
            cur.execute("""
                SELECT 
                    id, personal_case_id, view_type, label, storage_path, filename, 
                    mimetype, file_size, width, height, laterality, calibration, created_at
                FROM learner_personal_case_imaging
                WHERE personal_case_id = %s
                ORDER BY created_at ASC
            """, (str(case_id),))
            imaging_rows = cur.fetchall()
            
            case_dict = dict(row)
            case_dict["imaging"] = imaging_rows
            return case_dict
    finally:
        conn.close()

def update_personal_case(case_id: UUID, owner_user_id: UUID, case_in: LearnerPersonalCaseUpdate) -> Optional[Dict[str, Any]]:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # Verify ownership
            cur.execute("SELECT id FROM learner_personal_cases WHERE id = %s AND owner_user_id = %s", (str(case_id), str(owner_user_id)))
            if not cur.fetchone():
                return None
                
            updates = []
            values = []
            for field, value in case_in.dict(exclude_unset=True).items():
                if field in ('patient', 'objectives'):
                    updates.append(f"{field} = %s")
                    values.append(json.dumps(value))
                else:
                    updates.append(f"{field} = %s")
                    values.append(value)
                    
            if not updates:
                return get_personal_case_detail(case_id, owner_user_id)
                
            updates.append("updated_at = now()")
            values.extend([str(case_id), str(owner_user_id)])
            
            query = f"UPDATE learner_personal_cases SET {', '.join(updates)} WHERE id = %s AND owner_user_id = %s"
            cur.execute(query, tuple(values))
            conn.commit()
            
            return get_personal_case_detail(case_id, owner_user_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def delete_personal_case(case_id: UUID, owner_user_id: UUID) -> bool:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM learner_personal_cases WHERE id = %s AND owner_user_id = %s RETURNING id", (str(case_id), str(owner_user_id)))
            row = cur.fetchone()
            conn.commit()
            return bool(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
