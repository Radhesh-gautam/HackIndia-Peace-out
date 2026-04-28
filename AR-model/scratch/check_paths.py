import os
import json

DATA_FILE = "faces_data.json"

if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    print(f"Total entries in JSON: {len(data)}")
    for name, info in data.items():
        path = info.get("image_path")
        exists = os.path.exists(path)
        print(f"Name: {name}, Path: {path}, Exists: {exists}")
else:
    print("DATA_FILE not found")
