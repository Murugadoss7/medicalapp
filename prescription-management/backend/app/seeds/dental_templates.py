"""
Dental Observation Template Seed Data
Provides common pre-defined observation note templates
Run with: python -m app.seeds.dental_templates
"""

from uuid import uuid4
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.dental import DentalObservationTemplate

# Common templates for dental observations
TEMPLATE_DATA = [
    # Cavity templates
    {
        "condition_type": "Cavity",
        "tooth_surface": "Occlusal",
        "severity": "Mild",
        "template_text": "Small occlusal pit cavity. Minimal enamel involvement. Recommend composite restoration.",
        "short_code": "CAV-OCC-M",
        "display_order": 1,
    },
    {
        "condition_type": "Cavity",
        "tooth_surface": "Occlusal",
        "severity": "Moderate",
        "template_text": "Class I cavity extending into dentin. Moderate depth. Recommend amalgam or composite restoration.",
        "short_code": "CAV-OCC-MD",
        "display_order": 2,
    },
    {
        "condition_type": "Cavity",
        "tooth_surface": "Occlusal",
        "severity": "Severe",
        "template_text": "Deep occlusal cavity with pulp involvement risk. May require pulp capping or root canal treatment.",
        "short_code": "CAV-OCC-S",
        "display_order": 3,
    },
    {
        "condition_type": "Cavity",
        "tooth_surface": "Mesial",
        "severity": None,  # Wildcard - matches any severity
        "template_text": "Class II mesial cavity. Proximal contact involvement. Recommend restoration with matrix band.",
        "short_code": "CAV-MES",
        "display_order": 4,
    },
    {
        "condition_type": "Cavity",
        "tooth_surface": "Distal",
        "severity": None,
        "template_text": "Class II distal cavity. Proximal contact involvement. Recommend restoration with matrix band.",
        "short_code": "CAV-DIS",
        "display_order": 5,
    },
    {
        "condition_type": "Cavity",
        "tooth_surface": None,  # Wildcard - matches any surface
        "severity": "Severe",
        "template_text": "Deep cavity with significant dentin involvement. Assess pulp vitality. May require indirect pulp cap.",
        "short_code": "CAV-DEEP",
        "display_order": 6,
    },

    # Decay templates
    {
        "condition_type": "Decay",
        "tooth_surface": None,
        "severity": "Mild",
        "template_text": "Early enamel demineralization observed. Recommend fluoride treatment and dietary counseling.",
        "short_code": "DEC-MILD",
        "display_order": 10,
    },
    {
        "condition_type": "Decay",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Active carious lesion extending through enamel. Recommend excavation and restoration.",
        "short_code": "DEC-MOD",
        "display_order": 11,
    },
    {
        "condition_type": "Decay",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Extensive decay with possible pulp exposure. Assess for endodontic treatment or extraction.",
        "short_code": "DEC-SEV",
        "display_order": 12,
    },

    # Fracture templates
    {
        "condition_type": "Fracture",
        "tooth_surface": None,
        "severity": "Mild",
        "template_text": "Minor enamel chip. No dentin exposure. May smooth edges or place composite.",
        "short_code": "FX-CHIP",
        "display_order": 20,
    },
    {
        "condition_type": "Fracture",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Enamel-dentin fracture without pulp exposure. Recommend composite restoration or crown.",
        "short_code": "FX-MOD",
        "display_order": 21,
    },
    {
        "condition_type": "Fracture",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Complicated crown fracture with pulp exposure. Urgent endodontic treatment required.",
        "short_code": "FX-PULP",
        "display_order": 22,
    },
    {
        "condition_type": "Fracture",
        "tooth_surface": "Incisal",
        "severity": None,
        "template_text": "Incisal edge fracture. Assess for occlusal interference. Composite buildup or crown indicated.",
        "short_code": "FX-INC",
        "display_order": 23,
    },

    # Root Canal templates
    {
        "condition_type": "Root Canal",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Previously treated endodontic tooth. Assess restoration integrity and periapical status.",
        "short_code": "RCT-PREV",
        "display_order": 30,
    },
    {
        "condition_type": "Root Canal",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Irreversible pulpitis suspected. Patient reports spontaneous pain. Root canal treatment indicated.",
        "short_code": "RCT-IND",
        "display_order": 31,
    },
    {
        "condition_type": "Root Canal",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Periapical abscess present. Requires drainage and root canal treatment or extraction.",
        "short_code": "RCT-ABS",
        "display_order": 32,
    },

    # Crown templates
    {
        "condition_type": "Crown",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Existing crown present. Margins intact. No secondary decay visible.",
        "short_code": "CRN-OK",
        "display_order": 40,
    },
    {
        "condition_type": "Crown",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Open crown margin noted. Secondary decay possible. Recommend replacement.",
        "short_code": "CRN-REP",
        "display_order": 41,
    },

    # Abscess templates
    {
        "condition_type": "Abscess",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Localized swelling and tenderness to percussion. Periapical pathology suspected.",
        "short_code": "ABS-PA",
        "display_order": 50,
    },
    {
        "condition_type": "Abscess",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Acute periapical abscess with facial swelling. Requires immediate drainage and antibiotics.",
        "short_code": "ABS-ACU",
        "display_order": 51,
    },

    # Gum Disease templates
    {
        "condition_type": "Gum Disease",
        "tooth_surface": None,
        "severity": "Mild",
        "template_text": "Marginal gingivitis. Mild bleeding on probing. Recommend improved oral hygiene and scaling.",
        "short_code": "GUM-GIN",
        "display_order": 60,
    },
    {
        "condition_type": "Gum Disease",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Moderate periodontitis. Pocket depths 4-6mm. Recommend scaling and root planing.",
        "short_code": "GUM-SRP",
        "display_order": 61,
    },
    {
        "condition_type": "Gum Disease",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Advanced periodontitis. Pocket depths >6mm with bone loss. Periodontal surgery may be indicated.",
        "short_code": "GUM-ADV",
        "display_order": 62,
    },

    # Plaque and Calculus templates
    {
        "condition_type": "Plaque",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Visible plaque accumulation. Oral hygiene instruction provided. Recommend professional cleaning.",
        "short_code": "PLQ",
        "display_order": 70,
    },
    {
        "condition_type": "Calculus",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Supragingival calculus deposits present. Recommend prophylaxis and scaling.",
        "short_code": "CALC-SUP",
        "display_order": 71,
    },
    {
        "condition_type": "Calculus",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Subgingival calculus detected. Requires scaling and root planing.",
        "short_code": "CALC-SUB",
        "display_order": 72,
    },

    # Stain templates
    {
        "condition_type": "Stain",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Extrinsic staining noted. Recommend professional cleaning and polishing.",
        "short_code": "STN-EXT",
        "display_order": 80,
    },
    {
        "condition_type": "Stain",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Significant discoloration present. Consider bleaching or whitening treatment.",
        "short_code": "STN-BLH",
        "display_order": 81,
    },

    # Mobility templates
    {
        "condition_type": "Mobility",
        "tooth_surface": None,
        "severity": "Mild",
        "template_text": "Grade I mobility detected. Monitor periodontal status. May require splinting.",
        "short_code": "MOB-1",
        "display_order": 90,
    },
    {
        "condition_type": "Mobility",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Grade II mobility. Significant lateral movement. Evaluate for periodontal treatment or extraction.",
        "short_code": "MOB-2",
        "display_order": 91,
    },
    {
        "condition_type": "Mobility",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Grade III mobility. Vertical and lateral movement. Extraction likely indicated.",
        "short_code": "MOB-3",
        "display_order": 92,
    },

    # Filling templates
    {
        "condition_type": "Filling",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Existing restoration present. Good adaptation. No secondary decay.",
        "short_code": "FIL-OK",
        "display_order": 100,
    },
    {
        "condition_type": "Filling",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Defective restoration margin. Secondary decay possible. Recommend replacement.",
        "short_code": "FIL-DEF",
        "display_order": 101,
    },
    {
        "condition_type": "Filling",
        "tooth_surface": None,
        "severity": "Severe",
        "template_text": "Failed restoration with extensive secondary decay. May require crown or extraction.",
        "short_code": "FIL-FAIL",
        "display_order": 102,
    },

    # Missing tooth templates
    {
        "condition_type": "Missing",
        "tooth_surface": None,
        "severity": None,
        "template_text": "Tooth previously extracted. Assess for replacement options (implant, bridge, denture).",
        "short_code": "MIS-EX",
        "display_order": 110,
    },
    {
        "condition_type": "Missing",
        "tooth_surface": None,
        "severity": "Moderate",
        "template_text": "Missing tooth causing drift of adjacent teeth. Replacement recommended.",
        "short_code": "MIS-DRF",
        "display_order": 111,
    },
]


def seed_templates(db: Session) -> int:
    """Seed dental observation templates"""
    created_count = 0

    for template_data in TEMPLATE_DATA:
        # Check if template with same short_code already exists
        existing = db.query(DentalObservationTemplate).filter(
            DentalObservationTemplate.short_code == template_data["short_code"],
            DentalObservationTemplate.is_active == True
        ).first()

        if existing:
            print(f"Template {template_data['short_code']} already exists, skipping...")
            continue

        template = DentalObservationTemplate(
            id=uuid4(),
            condition_type=template_data["condition_type"],
            tooth_surface=template_data.get("tooth_surface"),
            severity=template_data.get("severity"),
            template_text=template_data["template_text"],
            short_code=template_data["short_code"],
            display_order=template_data["display_order"],
            is_global=True,  # All seed templates are global
            specialization=None,  # Available to all specializations
            created_by_doctor=None,  # System-created
        )

        db.add(template)
        created_count += 1
        print(f"Created template: {template_data['short_code']}")

    db.commit()
    return created_count


def run_seed():
    """Run the seed script"""
    db = SessionLocal()
    try:
        print("Seeding dental observation templates...")
        count = seed_templates(db)
        print(f"\nCompleted! Created {count} templates.")
    except Exception as e:
        print(f"Error seeding templates: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
