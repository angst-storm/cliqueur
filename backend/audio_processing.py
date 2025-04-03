import asyncio

from gigachat_handler import GigachatSender
from presentation_handler import extract_text
from fastapi import WebSocket
from fastapi.responses import HTMLResponse
from whisperlivekit import WhisperLiveKit
from whisperlivekit.audio_processor import AudioProcessor

turbo = "large-v3-turbo"
kit = WhisperLiveKit(model=turbo, language='ru', model_cache_dir='models')


def front_page():
    return HTMLResponse(kit.web_interface())


async def handle_websocket_results(websocket, results_generator):
    giga_sender = GigachatSender(extract_text())
    giga_sender.start_text_processing()
    async for response in results_generator:
        text = response['buffer_transcription']
        await giga_sender.add_text(text)


async def audio_endpoint(websocket: WebSocket):
    audio_processor = AudioProcessor()
    await websocket.accept()
    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(websocket, results_generator)
    )

    try:
        while True:
            message = await websocket.receive_bytes()
            await audio_processor.process_audio(message)
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_task.cancel()
