import uvicorn
from fastapi import FastAPI, WebSocket
from starlette.middleware.cors import CORSMiddleware
from asyncio import create_task

import audio_processing
import presentation_handler

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def get():
    return audio_processing.front_page()  # Use the built-in web interface


@app.websocket("/ws/asr")
async def websocket_endpoint(websocket: WebSocket):
    await audio_processing.audio_endpoint(websocket)


@app.websocket("/ws/presentation")
async def websocket_endpoint(websocket: WebSocket):
    await presentation_handler.process_presentation(websocket)


@app.websocket("/ws/slides")
async def websocket_endpoint(websocket: WebSocket):
    await create_task(presentation_handler.send_slide_number(websocket))


if __name__ == "__main__":
    uvicorn.run("server:app", port=8000, log_level="info")
