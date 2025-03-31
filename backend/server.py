import uvicorn
from fastapi import FastAPI, WebSocket

import audio_processing

app = FastAPI()


@app.get("/")
async def get():
    return audio_processing.front_page()  # Use the built-in web interface


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await audio_processing.audio_endpoint(websocket)

if __name__ == "__main__":
    uvicorn.run("server:app", port=8000, log_level="info")
