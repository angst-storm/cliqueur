import os
from datetime import datetime
from pathlib import Path

import torch
import whisper
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import uvicorn
from starlette.websockets import WebSocketDisconnect

app = FastAPI()

device = "cuda:0"
model = whisper.load_model("turbo", device=device)  # Загружаем модель один раз


def process_audio_file(filename: str):
    """Обработка аудио файла с помощью Whisper"""
    try:
        result = model.transcribe(filename)
        print(result)
    except Exception as e:
        print(f"Ошибка транскрибации: {e}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_bytes()
            filename = 'audio_recordings\\' + f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm"  # Уникальное имя файла
            with open(filename, "wb") as f:
                f.write(data)
            print(f"Получено {len(data)} байт, всего: {os.path.getsize(filename)} байт")

    except WebSocketDisconnect:
        print(f"Клиент отключен.")
        # Обработка файла после отключения клиента
        # process_audio_file(filename)

    except Exception as e:
        print(f"Ошибка: {str(e)}")
    finally:
        # Удаляем временный файл после обработки (по желанию)
        # Path(filename).unlink(missing_ok=True)
        pass


if __name__ == "__main__":
    # Создаем папку для аудио файлов
    Path("audio_recordings").mkdir(exist_ok=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
