import asyncio
from pathlib import Path

import uvicorn
from starlette.responses import HTMLResponse
from whisperlivekit import WhisperLiveKit
from whisperlivekit.audio_processor import AudioProcessor
from fastapi import FastAPI, WebSocket

Path("models").mkdir(exist_ok=True)
kit = WhisperLiveKit(model="large-v3-turbo", diarization=False, model_cache_dir="models\\", task="transcribe")
app = FastAPI()  # Create a FastAPI application


@app.get("/")
async def get():
    return HTMLResponse(kit.web_interface())  # Use the built-in web interface


async def handle_websocket_results(websocket, results_generator):  # Sends results to frontend
    async for response in results_generator:
        print(response['buffer_transcription'])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    audio_processor = AudioProcessor()
    await websocket.accept()
    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(handle_websocket_results(websocket, results_generator))

    while True:
        message = await websocket.receive_bytes()
        await audio_processor.process_audio(message)


@app.websocket("/ws/upload-presentation")
async def upload_presentation(websocket: WebSocket):
    pass

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
