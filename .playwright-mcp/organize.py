import os
import shutil
from pathlib import Path

root = Path(__file__).parent

for file in root.iterdir():
    if file.is_file() and file.name != "organize.py":
        ext = file.suffix.lstrip(".")
        if ext:
            dest = root / ext
            dest.mkdir(exist_ok=True)
            shutil.move(str(file), str(dest / file.name))

print("Done.")
