import os
from datetime import datetime
from pathlib import Path

import torch
import whisper
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import uvicorn
from starlette.websockets import WebSocketDisconnect
import numpy as np

app = FastAPI()

device = "cuda:0"
model = whisper.load_model("turbo", device=device)  # Загружаем модель один раз


def process_audio_file(data: np.ndarray):
    """Обработка аудио файла с помощью Whisper"""
    try:
        result = model.transcribe(data, language='ru', condition_on_previous_text=False)
        print(result)
    except Exception as e:
        print(f"Ошибка транскрибации: {e}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    all_data = []
    try:
        while True:
            data = await websocket.receive_bytes()
            # filename = 'audio_recordings\\' + f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"  # Уникальное имя файла
            # with open(filename, "wb") as f:
            #     f.write(data)
            # print(f"Получено {len(data)} байт, всего: {os.path.getsize(filename)} байт")

            print(len(data))
            if len(data) % 2 != 0:
                data = data[:-1]
            np_data = np.frombuffer(data, dtype=np.int16)
            np_data = np_data.astype(np.float32)
            np_data = np_data / 32768.0
            all_data.append(np_data)

    except WebSocketDisconnect:
        print(f"Клиент отключен.")
        for chunk in all_data:
            process_audio_file(chunk)

    # except Exception as e:
    #     print(f"Ошибка приема: {str(e)}")
    finally:
        # Удаляем временный файл после обработки (по желанию)
        # Path(filename).unlink(missing_ok=True)
        pass


if __name__ == "__main__":
    # Создаем папку для аудио файлов
    Path("audio_recordings").mkdir(exist_ok=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
