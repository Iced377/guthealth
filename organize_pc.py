import os
import shutil
import argparse
from pathlib import Path
from datetime import datetime

# --- CONFIGURATION ---
TARGET_DIRS = ["Desktop", "Downloads", "Documents"]
# Destination is now a specific folder in Downloads
ORGANIZED_ROOT = Path.home() / "Downloads" / "Feb 2025-2026"

# Date threshold: February 1, 2025
DATE_THRESHOLD = datetime(2025, 2, 1).timestamp()

CATEGORIES = {
    "Screenshots": [], # Special case: name contains "screenshot"
    "GutCheck": [],    # Special case: related to the project
    "Documents": [".pdf", ".docx", ".doc", ".txt", ".pptx", ".xlsx", ".csv", ".rtf", ".pages", ".key", ".numbers"],
    "Media/Photos": [".jpg", ".jpeg", ".png", ".heic", ".gif", ".tiff", ".bmp", ".webp"],
    "Media/Videos": [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv"],
    "Creatives/Design": [".ai", ".psd", ".fig", ".sketch", ".indd"],
    "Archives": [".zip", ".dmg", ".pkg", ".rar", ".7z", ".tar", ".gz"],
}

# Keywords to identify GutCheck-related files
GUTCHECK_KEYWORDS = [
    "gutcheck", "guthealth", "nutrition", "meal", "macro", 
    "calorie", "liquid-crystal", "liquid-glass", "coach", 
    "smar", "fodmap", "trends", "dashboard", "dietitian"
]

def is_gutcheck_related(file_path):
    name_lower = file_path.name.lower()
    return any(keyword in name_lower for keyword in GUTCHECK_KEYWORDS)

def organize_files(dry_run=True):
    organized_base = ORGANIZED_ROOT
    home = Path.home()
    
    status_prefix = "DRY RUN: " if dry_run else "EXECUTING: "
    print(f"{status_prefix}Organizing files created after Feb 1, 2025 into {organized_base}")
    
    if not dry_run:
        organized_base.mkdir(parents=True, exist_ok=True)

    for target in TARGET_DIRS:
        target_path = home / target
        if not target_path.exists():
            continue
            
        print(f"\nScanning: {target_path}")
        
        for item in target_path.iterdir():
            # Basic filters: must be a file, not hidden, and newer than Feb 2025
            if item.is_file() and not item.name.startswith('.'):
                try:
                    # Using ctime (creation time) - on Mac this is birthtime
                    creation_time = item.stat().st_birthtime
                except AttributeError:
                    # Fallback to mtime if birthtime is not available
                    creation_time = item.stat().st_ctime
                
                if creation_time < DATE_THRESHOLD:
                    continue
                
                category = get_category(item)
                dest_dir = organized_base / category
                
                if dry_run:
                    print(f"[WILL MOVE] {item.name} -> {category}/")
                else:
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    # Handle duplicate filenames
                    final_dest = dest_dir / item.name
                    if final_dest.exists():
                        final_dest = dest_dir / f"{item.stem}_{int(item.stat().st_mtime)}{item.suffix}"
                    
                    try:
                        shutil.move(str(item), str(final_dest))
                        print(f"[MOVED] {item.name}")
                    except Exception as e:
                        print(f"[ERROR] Could not move {item.name}: {e}")

def get_category(file_path):
    name_lower = file_path.name.lower()
    ext_lower = file_path.suffix.lower()
    
    # Priority 1: Screenshots (as specifically requested)
    if "screenshot" in name_lower:
        return "Screenshots"
    
    # Priority 2: GutCheck Related (Keywords matching)
    if is_gutcheck_related(file_path):
        # We can further categorize inside GutCheck or just move to a root GutCheck folder
        # Let's put them in GutCheck/Photos, GutCheck/Videos etc if it's media
        if ext_lower in CATEGORIES["Media/Photos"]:
            return "GutCheck/Media/Photos"
        if ext_lower in CATEGORIES["Media/Videos"]:
            return "GutCheck/Media/Videos"
        return "GutCheck/Assets"
    
    # Priority 3: Extension mapping for others
    for category, extensions in CATEGORIES.items():
        if ext_lower in extensions:
            return category
            
    return "Others"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Organize PC files locally with Feb 2025 filter.")
    parser.add_argument("--run", action="store_true", help="Run the actual organization (removes dry-run mode)")
    args = parser.parse_args()
    
    organize_files(dry_run=not args.run)
    
    if not args.run:
        print("\n" + "="*40)
        print("Note: This was a DRY RUN. No files were moved.")
        print("To execute the movement, run:")
        print("python3 organize_pc.py --run")
        print("="*40)
