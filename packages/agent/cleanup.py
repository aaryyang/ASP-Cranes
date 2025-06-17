"""
ASP Cranes Project Cleanup Script

This script helps you organize your project by:
1. Creating a backup of your current files
2. Removing unnecessary files
3. Organizing the directory structure

Usage:
    python cleanup.py [--dryrun]
"""

import os
import shutil
import argparse
from datetime import datetime

# Define paths
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(os.path.dirname(ROOT_DIR), "ASP-Cranes-Agent-Backup-" + datetime.now().strftime("%Y%m%d%H%M%S"))

# Files to remove
FILES_TO_REMOVE = [
    "simple_api_server.py",
    "api_server.py",
    "debug_agent.py"
]

# Optional directories to archive (move to backup but not delete)
DIRS_TO_ARCHIVE = [
    "eval",
    "tests",
    "deployment",
    "attached_assets"
]

# Function to create backup
def create_backup(root_dir, backup_dir, dryrun=False):
    print(f"Creating backup of {root_dir} to {backup_dir}")
    if not dryrun:
        shutil.copytree(root_dir, backup_dir)
    print(f"{'Would have created' if dryrun else 'Created'} backup at: {backup_dir}")

# Function to remove files
def remove_files(files_to_remove, dryrun=False):
    print("\nRemoving unnecessary files:")
    for file_path in files_to_remove:
        abs_path = os.path.join(ROOT_DIR, file_path)
        if os.path.exists(abs_path):
            print(f"  {'Would remove' if dryrun else 'Removing'}: {file_path}")
            if not dryrun:
                os.remove(abs_path)
        else:
            print(f"  Skipping (not found): {file_path}")

# Function to archive directories
def archive_dirs(dirs_to_archive, dryrun=False):
    print("\nArchiving directories:")
    for dir_name in dirs_to_archive:
        src_path = os.path.join(ROOT_DIR, dir_name)
        if os.path.exists(src_path) and os.path.isdir(src_path):
            # Create equivalent path in backup
            rel_path = os.path.relpath(src_path, ROOT_DIR)
            dst_path = os.path.join(BACKUP_DIR, rel_path)
            
            print(f"  {'Would archive' if dryrun else 'Archiving'}: {dir_name}")
            if not dryrun:
                # Remove from backup dir (it was copied earlier)
                if os.path.exists(dst_path):
                    # Directory exists in backup, now remove the original
                    shutil.rmtree(src_path)
        else:
            print(f"  Skipping (not found): {dir_name}")

# Main function
def main():
    parser = argparse.ArgumentParser(description="Clean up the ASP Cranes project structure")
    parser.add_argument("--dryrun", action="store_true", help="Show what would be done without making changes")
    args = parser.parse_args()
    
    if args.dryrun:
        print("*** DRY RUN MODE - No changes will be made ***\n")
    
    print("ASP Cranes Project Cleanup")
    print("=========================\n")
    
    # Get confirmation before proceeding
    if not args.dryrun:
        confirm = input("This will remove unnecessary files and reorganize the project.\n"
                      "A backup will be created first. Continue? (y/n): ")
        if confirm.lower() != 'y':
            print("Cleanup cancelled.")
            return
    
    # Create backup first
    create_backup(ROOT_DIR, BACKUP_DIR, args.dryrun)
    
    # Remove unnecessary files
    remove_files(FILES_TO_REMOVE, args.dryrun)
    
    # Archive directories
    archive_dirs(DIRS_TO_ARCHIVE, args.dryrun)
    
    print("\nCleanup complete!")
    print(f"Backup created at: {BACKUP_DIR}")
    print("\nNext steps:")
    print("  1. Review the backup to ensure nothing important was removed")
    print("  2. If needed, restore any files from the backup")
    print("  3. See cleanup-guide.md for more information on the project structure")

if __name__ == "__main__":
    main()
