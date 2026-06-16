import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

if ENVIRONMENT == "local":
    from motor.motor_asyncio import AsyncIOMotorClient
    print(f"Starting in LOCAL mode: Connecting to MongoDB at {MONGODB_URI}")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.ai_copilot
else:
    print("Starting in PRODUCTION mode: Using local JSON storage instead of MongoDB.")
    
    DB_FILE = "uploads/db.json"

    class LocalJSONCollection:
        def __init__(self):
            self.lock = asyncio.Lock()

        def _read(self):
            if not os.path.exists(DB_FILE):
                return []
            try:
                with open(DB_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                return []

        def _write(self, data):
            os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
            with open(DB_FILE, "w") as f:
                json.dump(data, f, indent=2)

        def _matches(self, doc, query):
            for k, v in query.items():
                if doc.get(k) != v:
                    return False
            return True

        async def drop(self):
            async with self.lock:
                self._write([])

        async def insert_one(self, doc):
            async with self.lock:
                data = self._read()
                data.append(doc)
                self._write(data)
                
        async def find_one(self, query):
            async with self.lock:
                data = self._read()
                for doc in data:
                    if self._matches(doc, query):
                        return doc
                return None

        async def update_one(self, query, update):
            async with self.lock:
                data = self._read()
                updated = False
                for doc in data:
                    if self._matches(doc, query):
                        if "$set" in update:
                            for uk, uv in update["$set"].items():
                                doc[uk] = uv
                        updated = True
                        break
                if updated:
                    self._write(data)
                
        async def delete_one(self, query):
            async with self.lock:
                data = self._read()
                new_data = [doc for doc in data if not self._matches(doc, query)]
                self._write(new_data)

    class LocalJSONDatabase:
        def __init__(self):
            self.datasets = LocalJSONCollection()

    db = LocalJSONDatabase()
