import asyncio
import os
import logging

import presentation_handler
from gigachat_handler import GigachatSender
from fastapi import WebSocket
from fastapi.responses import HTMLResponse
from whisperlivekit import WhisperLiveKit
from whisperlivekit.audio_processor import AudioProcessor

from phrase_matcher import PhraseMatcher

WHISPER_SIZE = os.getenv("WHISPER_SIZE", "large-v3-turbo")
FORWARD_PHRASE = "кликер вперед"
BACKWARD_PHRASE = "кликер назад"

kit = WhisperLiveKit(model=WHISPER_SIZE, language="ru", model_cache_dir="models")
matcher = PhraseMatcher(match_threshold=0.7, word_distance=2)  # можешь конфигурировать

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def front_page():
    return HTMLResponse(kit.web_interface())


async def handle_websocket_results(results_generator, pres_id):
    delay_sum = 0.0
    count = 0
    giga_sender = GigachatSender(pres_id)
    giga_sender.start_text_processing()
    async for response in results_generator:
        delay = response["remaining_time_transcription"]
        delay_sum += delay
        count += 1
        logger.info("Current model delay: %s Average: %s", delay, delay_sum / count)

        text = response["buffer_transcription"]
        await bypass_mode(text, giga_sender)
        if presentation_handler.pres_status["isKeywordMode"]:
            await keywords_mode(text, giga_sender)
        await giga_sender.add_text(text)


async def bypass_mode(text: str, giga: GigachatSender):
    if matcher.compare(text, FORWARD_PHRASE):
        logger.info("NEXT SLIDE")
        giga.turn_off_for_bypass()
        await presentation_handler.slides_queue.put({'+': 1})

    if matcher.compare(text, BACKWARD_PHRASE):
        logger.info("PREV SLIDE")
        giga.turn_off_for_bypass()
        await presentation_handler.slides_queue.put({'-': 1})


async def audio_endpoint(websocket: WebSocket):
    audio_processor = AudioProcessor()
    await websocket.accept()
    pres_id = await websocket.receive_text()
    logger.info("Extracting text from %s", pres_id)
    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(results_generator, pres_id)
    )

    try:
        while True:
            message = await websocket.receive_bytes()
            await audio_processor.process_audio(message)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        websocket_task.cancel()


async def keywords_mode(text: str, giga: GigachatSender):
    for slide_num, target_phrases in presentation_handler.bracketed_notes_map.items():
        for phrase in target_phrases:
            if matcher.compare(text, phrase):
                giga.turn_off_for_bypass()
                await presentation_handler.slides_queue.put({slide_num: 1})
                logger.info(f"[keywords_mode] Найдена фраза: '{phrase}' → слайд {slide_num}")
                return
