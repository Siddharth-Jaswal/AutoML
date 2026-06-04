import httpx
import json
import os

async def stream_chat_response(summary_data: dict, chat_history: list, user_message: str):
    gateway_url = os.getenv("LLM_GATEWAY_URL", "http://localhost:9000").rstrip("/")
    
    # Strip unnecessary massive fields to save context window tokens
    safe_summary = summary_data.copy()
    if "correlation" in safe_summary:
        pass # maybe strip heavy correlation matrix if it's too big, but let's leave it for now
        
    prompt = f"System: You are an expert AI Data Science Copilot inside an AutoML application. Analyze the provided dataset summary and answer the user's questions clearly, concisely, and accurately. Do not include markdown code blocks unless writing code.\n\n"
    prompt += f"Dataset Summary:\n{json.dumps(safe_summary, indent=2)}\n\n"
    
    if chat_history:
        prompt += "Chat History:\n"
        for msg in chat_history[-5:]: # Keep last 5 messages to save context
            role = "User" if msg.role == "user" else "Assistant"
            prompt += f"{role}: {msg.content}\n"
    
    prompt += f"\nUser: {user_message}\nAssistant:"
    
    payload = {
        "message": prompt,
        "stream": True
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{gateway_url}/chat", json=payload) as response:
                if response.status_code != 200:
                    yield f"Error: LLM Gateway returned status {response.status_code}".encode('utf-8')
                    return
                    
                async for chunk in response.aiter_bytes():
                    yield chunk
    except Exception as e:
        yield f"Error communicating with LLM Gateway: {str(e)}".encode('utf-8')
