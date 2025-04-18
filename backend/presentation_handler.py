import asyncio
import logging
import os
import re
from tempfile import NamedTemporaryFile
import pptx
from s3 import s3_resource, BUCKET_NAME
import boto3
import uuid
import os

import aspose.slides as slides
from aspose.slides.export import HtmlOptions, SaveFormat
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

PRESENTATION_LINK_BASE = os.getenv("PRESENTATION_LINK_BASE")

MIN_PROBABILITY = 0.4
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
slides_queue = asyncio.Queue()


class PresentationConverter:
    @staticmethod
    def convert_to_html(file_data: bytes) -> str:
        with NamedTemporaryFile(delete=False, suffix=".pptx") as temp_pptx:
            temp_pptx.write(file_data)
            temp_pptx_path = temp_pptx.name

        try:
            with slides.Presentation(temp_pptx_path) as pres:
                options = HtmlOptions()
                output_path = temp_pptx_path.replace(".pptx", ".html")
                pres.save(output_path, SaveFormat.HTML, options)

            with open(output_path, "r", encoding="utf-8") as f:
                html_content = f.read()

            html_content = re.sub(
                r"<tspan[^>]*>Evaluation only\.</tspan>", "", html_content
            )
            html_content = re.sub(
                r"<tspan[^>]*>Created with Aspose\.Slides[^<]*</tspan>",
                "",
                html_content,
            )
            html_content = re.sub(
                r"<tspan[^>]*>Copyright \d{4}-\d{4}Aspose Pty Ltd\.</tspan>",
                "",
                html_content,
            )
            html_content = re.sub(
                r'<div\s+class="slideTitle">.*?</div>', "", html_content
            )

        finally:
            os.unlink(temp_pptx_path)
            if os.path.exists(output_path):
                os.unlink(output_path)

        return html_content


async def process_presentation(websocket: WebSocket):
    await websocket.accept()
    logger.info("Pres WebSocket подключен")

    try:
        pptx_data = await websocket.receive_bytes()
        logger.info("Получен файл %s байт", len(pptx_data))

        html = PresentationConverter.convert_to_html(pptx_data)

        pres_id = uuid.uuid4()

        save_s3(pres_id, html, pptx_data)

        await websocket.send_text(html)
        logger.info("HTML %s успешно отправлен", pres_id)

        link = f"{PRESENTATION_LINK_BASE}/{pres_id}"
        await websocket.send_text(link)
        logger.info("Отправлена ссылка %s", link)

    except WebSocketDisconnect:
        logger.info("Клиент pres отключился")
    except Exception as e:
        logger.error("Ошибка обработки: %s", e)
        await websocket.send_text(f"Ошибка конвертации: {str(e)}")

    finally:
        await websocket.close()


def extract_text(file_name: str = "pres.pptx") -> dict[int, list[str]]:
    pres = pptx.Presentation(file_name)
    text = {}
    for idx, slide in enumerate(pres.slides):
        text[idx] = []
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text[idx].append(shape.text)
    return text


async def send_slide_number(websocket: WebSocket):
    await websocket.accept()
    logger.info("Slides WebSocket подключен")
    try:
        while True:
            slides_probs = await slides_queue.get()
            if not slides_probs:
                logger.info("Slides: skipping empty dict")
                continue

            slide = max(slides_probs.items(), key=lambda x: x[1])
            logger.info(f"Top slide is {slide}")
            if slide[1] >= MIN_PROBABILITY:
                logger.info(f"Confident enough. Sending number {slide[0]}")
                await websocket.send_text(str(slide[0]))
    except WebSocketDisconnect:
        logger.info("Клиент slides отключился")
    except Exception as e:
        logger.error(f"Ошибка отправки слайда: {str(e)}")
    finally:
        await websocket.close()


def save_s3(pres_id: str, html: str, pptx_data: bytes):
    html_object = s3_resource.Object(BUCKET_NAME, f"{pres_id}/index.html")
    html_object.put(Body=html)

    pptx_object = s3_resource.Object(BUCKET_NAME, f"{pres_id}/file.pptx")
    pptx_object.put(Body=pptx_data)

    logger.info("Презентация %s успешно сохранена в S3", pres_id)
