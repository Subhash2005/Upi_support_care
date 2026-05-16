import os
import google.generativeai as genai
from dotenv import load_dotenv
from database import get_transaction_sync

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Define tools
def get_upi_transaction_details(utr: str) -> dict:
    """Fetch the status of a UPI transaction using its UTR number. Always use this first."""
    txn = get_transaction_sync(utr)
    if not txn:
        return {"status": "error", "message": f"No transaction found for UTR: {utr}"}
    return {
        "status": "success",
        "utr": txn.get("utr"),
        "amount": txn.get("amount"),
        "transaction_status": txn.get("status"),
        "failure_reason": txn.get("failure_reason", "None"),
        "timestamp": txn.get("timestamp").isoformat() if txn.get("timestamp") else None
    }

def escalate_to_human(reason: str) -> dict:
    """Escalate the issue to a human support executive."""
    return {
        "status": "escalated",
        "message": f"Ticket created for human support. Reason: {reason}",
        "ticket_id": "TKT-999888"
    }

# Create the model instance with tools
model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    tools=[get_upi_transaction_details, escalate_to_human],
    system_instruction=(
        "You are an AI-Powered UPI Customer Support Agent. "
        "Your goal is to assist users with their UPI transaction issues, such as money debited but not credited. "
        "Always ask for the UTR number first if not provided. "
        "Once you have the UTR, use the get_upi_transaction_details tool to check the status. "
        "Based on the status and reason, explain the situation to the user clearly and professionally. "
        "For 'Receiver bank timeout' or 'NPCI delay', assure them the money will be auto-refunded or settled within 3-5 days. "
        "Be concise, polite, and reassuring. If you cannot help, use the escalate_to_human tool."
    )
)

# Keep track of active chat session for state
_chat_session = None

def run_agent(prompt: str) -> str:
    """Run the agent with a user prompt and return the string response."""
    global _chat_session
    try:
        if not _chat_session:
            _chat_session = model.start_chat(enable_automatic_function_calling=True)
            
        response = _chat_session.send_message(prompt)
        return response.text
    except Exception as e:
        return f"Error running AI agent: {str(e)}"
