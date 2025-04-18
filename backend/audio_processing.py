import asyncio
import os
import time
import logging

from gigachat_handler import GigachatSender
from presentation_handler import extract_text
from fastapi import WebSocket
from fastapi.responses import HTMLResponse
from whisperlivekit import WhisperLiveKit
from whisperlivekit.audio_processor import AudioProcessor

WHISPER_SIZE = os.getenv("WHISPER_SIZE", "large-v3-turbo")

kit = WhisperLiveKit(model=WHISPER_SIZE, language="ru", model_cache_dir="models")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def front_page():
    return HTMLResponse(kit.web_interface())


async def handle_websocket_results(websocket, results_generator, pres_id):
    delay_sum = 0.0
    count = 0
    giga_sender = GigachatSender(extract_text(pres_id))
    giga_sender.start_text_processing()
    async for response in results_generator:
        text = response["buffer_transcription"]
        delay = response["remaining_time_transcription"]
        delay_sum += delay
        count += 1
        logger.info("Current model delay: %s Average: %s", delay, delay_sum / count)
        await giga_sender.add_text(text)


async def audio_endpoint(websocket: WebSocket):
    audio_processor = AudioProcessor()
    await websocket.accept()
    pres_id = await websocket.receive_text()
    logger.info("Extracting text from %s", pres_id)
    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(websocket, results_generator, pres_id)
    )

    try:
        while True:
            message = await websocket.receive_bytes()
            await audio_processor.process_audio(message)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        websocket_task.cancel()
