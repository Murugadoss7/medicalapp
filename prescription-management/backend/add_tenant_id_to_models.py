#!/usr/bin/env python3
"""
Script to add tenant_id field to all remaining SQLAlchemy models
Run this to bulk-update model files with tenant_id support
"""

import os
import re

# Models that need tenant_id
MODELS_TO_UPDATE = {
    "patient.py": {
        "class_name": "Patient",
        "relationship_name": "patients"
    },
    "medicine.py": {
        "class_name": "Medicine",
        "relationship_name": None  # Medicines don't need back_populates
    },
    "short_key.py": {
        "class_name": "ShortKey",
        "relationship_name": "short_keys"
    },
    "appointment.py": {
        "class_name": "Appointment",
        "relationship_name": "appointments"
    },
    "prescription.py": {
        "class_name": "Prescription",
        "relationship_name": "prescriptions"
    },
}

def add_tenant_id_to_model(file_path, class_name, relationship_name=None):
    """Add tenant_id field to a model file"""

    with open(file_path, 'r') as f:
        content = f.read()

    # Skip if already has tenant_id
    if 'tenant_id' in content:
        print(f"✓ {os.path.basename(file_path)} already has tenant_id - skipping")
        return False

    # 1. Add ForeignKey to imports if not present
    if 'ForeignKey' not in content:
        content = content.replace(
            'from sqlalchemy import ',
            'from sqlalchemy import ForeignKey, '
        )

    # 2. Find the class definition and add tenant_id after __tablename__
    class_pattern = rf'class {class_name}\(BaseModel\):.*?__tablename__ = "[^"]+"'
    match = re.search(class_pattern, content, re.DOTALL)

    if match:
        tenant_id_field = f'''

    # Multi-tenancy support
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,  # Nullable initially for migration
        comment="Tenant reference for multi-tenancy"
    )'''

        # Insert after __tablename__
        insert_pos = match.end()
        content = content[:insert_pos] + tenant_id_field + content[insert_pos:]

    # 3. Add tenant relationship (only if relationship_name provided)
    if relationship_name:
        # Find the # Relationships comment
        relationships_pattern = r'(# Relationships.*?\n)'
        match = re.search(relationships_pattern, content, re.DOTALL)

        if match:
            tenant_relationship = f'''
    tenant = relationship(
        "Tenant",
        back_populates="{relationship_name}"
    )

'''
            insert_pos = match.end()
            content = content[:insert_pos] + tenant_relationship + content[insert_pos:]

    # 4. Add tenant_id to __table_args__ indexes
    table_args_pattern = r'__table_args__ = \((.*?)\)'
    match = re.search(table_args_pattern, content, re.DOTALL)

    if match:
        existing_indexes = match.group(1).strip()
        # Add tenant_id index as first index
        new_indexes = f'''
        Index('idx_{class_name.lower()}s_tenant_id', 'tenant_id'),
        {existing_indexes}'''

        content = content.replace(
            f'__table_args__ = ({existing_indexes})',
            f'__table_args__ = ({new_indexes}'
        )

    # Write back
    with open(file_path, 'w') as f:
        f.write(content)

    print(f"✓ Updated {os.path.basename(file_path)}")
    return True


def main():
    """Main execution"""
    models_dir = "app/models"

    if not os.path.exists(models_dir):
        print(f"Error: {models_dir} directory not found!")
        print("Please run this script from the backend directory")
        return

    updated_count = 0

    for filename, config in MODELS_TO_UPDATE.items():
        file_path = os.path.join(models_dir, filename)

        if not os.path.exists(file_path):
            print(f"⚠ {filename} not found - skipping")
            continue

        if add_tenant_id_to_model(file_path, config["class_name"], config["relationship_name"]):
            updated_count += 1

    print(f"\n{'='*50}")
    print(f"Updated {updated_count} model files")
    print(f"{'='*50}")
    print("\nNext steps:")
    print("1. Review the changes in each model file")
    print("2. Update __init__.py to import Tenant model")
    print("3. Run: alembic upgrade head")
    print("4. Create RLS policies")


if __name__ == "__main__":
    main()
