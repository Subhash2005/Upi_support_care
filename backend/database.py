import os
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client["upi_support"]
transactions_collection = db["transactions"]

# Synchronous client for the AI Agent
sync_client = pymongo.MongoClient(MONGO_URI)
sync_db = sync_client["upi_support"]
sync_transactions = sync_db["transactions"]

async def get_transaction(utr: str):
    """Fetch a transaction by UTR."""
    return await transactions_collection.find_one({"utr": utr}, {"_id": 0})

def get_transaction_sync(utr: str):
    """Fetch a transaction by UTR synchronously."""
    return sync_transactions.find_one({"utr": utr}, {"_id": 0})

async def seed_fake_data():
    """Seed the database with some mock data for testing."""
    count = await transactions_collection.count_documents({})
    if count == 0:
        print("Seeding database with mock transactions...")
        mock_data = [
            {"utr": "123456789", "status": "FAILED", "reason": "Receiver bank timeout", "amount": 500, "sender": "HDFC", "receiver": "SBI"},
            {"utr": "987654321", "status": "PENDING", "reason": "NPCI delay", "amount": 1200, "sender": "ICICI", "receiver": "AXIS"},
            {"utr": "555555555", "status": "SUCCESS", "reason": "", "amount": 250, "sender": "SBI", "receiver": "HDFC"}
        ]
        await transactions_collection.insert_many(mock_data)
        print("Mock data seeded.")
