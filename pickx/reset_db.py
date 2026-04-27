import os
from pymongo import MongoClient
import json

MONGO_URI = "mongodb+srv://quanle2212_db_user:eDxVWzCSeYYHrv7N@pickxdb.3hafbwh.mongodb.net/?appName=PickxDb"

def reset():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client["pickx_db"]
    collection = db["state"]
    
    empty_state = {
        "players": [],
        "matches": [],
        "live_schedule": [],
        "live_rest": []
    }
    
    print("Resetting state to empty...")
    collection.replace_one({"_id": "main_state"}, empty_state, upsert=True)
    
    # Also reset local file if exists
    if os.path.exists("pickx_database.db"):
        with open("pickx_database.db", "w") as f:
            json.dump(empty_state, f, indent=4)
        print("Local backup reset.")
        
    client.close()
    print("Database reset SUCCESSFUL.")

if __name__ == "__main__":
    reset()
