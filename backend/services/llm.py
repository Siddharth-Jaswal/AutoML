import httpx
import json
import os
import asyncio
from groq import AsyncGroq, RateLimitError

async def stream_chat_response(summary_data: dict, chat_history: list, user_message: str):
    provider = os.getenv("LLM_PROVIDER", "gateway").lower()
    
    # Prune summary slightly to save tokens
    safe_summary = summary_data.copy()
    if "correlation" in safe_summary:
        pass # keep it for now unless we see token limits hit hard
        
    prompt = f"System: You are an expert AI Data Science Copilot inside an AutoML application. Analyze the provided dataset summary and answer the user's questions clearly, concisely, and accurately. Do not include markdown code blocks unless writing code.\n\n"
    prompt += f"Dataset Summary:\n{json.dumps(safe_summary, indent=2)}\n\n"
    
    if chat_history:
        prompt += "Chat History:\n"
        for msg in chat_history[-5:]: # Keep last 5 messages to save context
            role = "User" if msg.role == "user" else "Assistant"
            prompt += f"{role}: {msg.content}\n"
    
    prompt += f"\nUser: {user_message}\nAssistant:"

    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            yield b"Error: GROQ_API_KEY is not set in environment variables."
            return
            
        client = AsyncGroq(api_key=api_key)
        
        # We will use the messages format for Groq
        messages = [
            {"role": "system", "content": "You are an expert AI Data Science Copilot inside an AutoML application. Analyze the provided dataset summary and answer the user's questions clearly, concisely, and accurately. Do not include markdown code blocks unless writing code."},
            {"role": "user", "content": f"Here is the dataset summary: {json.dumps(safe_summary, indent=2)}"}
        ]
        
        for msg in chat_history[-5:]:
            messages.append({"role": msg.role, "content": msg.content})
            
        messages.append({"role": "user", "content": user_message})

        primary_model = "llama-3.3-70b-versatile"
        fallback_model = "meta-llama/llama-4-scout-17b-16e-instruct"
        
        try:
            stream = await client.chat.completions.create(
                model=primary_model,
                messages=messages,
                temperature=0.7,
                max_completion_tokens=2048,
                stream=True,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content.encode('utf-8')
                    
        except RateLimitError as e:
            # Fallback to secondary model if primary hits 12K TPM limit
            try:
                yield b"\n\n*[System: Switching to fallback model due to high traffic on primary model]*\n\n"
                stream = await client.chat.completions.create(
                    model=fallback_model,
                    messages=messages,
                    temperature=0.7,
                    max_completion_tokens=2048,
                    stream=True,
                )
                async for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content.encode('utf-8')
                        
            except RateLimitError as fallback_err:
                yield f"\n\nError: Both Groq models have reached their rate limit. Please wait a minute before asking another question.".encode('utf-8')
        except Exception as e:
            yield f"\n\nError communicating with Groq API: {str(e)}".encode('utf-8')
            
    else:
        # Gateway Fallback Mode
        gateway_url = os.getenv("LLM_GATEWAY_URL", "http://localhost:9000").rstrip("/")
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
