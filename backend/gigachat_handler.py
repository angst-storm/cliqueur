import asyncio
import logging

from langchain_core.messages import HumanMessage, SystemMessage

import presentation_handler
import os

from langchain_gigachat.chat_models import GigaChat

from ast import literal_eval

GIGACHAT_API_KEY = os.getenv("GIGACHAT_API_KEY")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

slides_prompt = (
    "Ты — система, определяющая соответствие речи слайдам. Используй анализ слайдов и историю речи, "
    "чтобы выбрать, к какому слайду относится текущая речь. Ответ строго в формате JSON: {{"
    "номер_слайда1: вероятность1, номер_слайда2: вероятность2, номер_слайда3: вероятность3}}. Например: "
    "{{5: 0.72, 4: 0.18, 6: 0.10}}. Никаких пояснений, только JSON. JSON с анализом слайдов: {"
    "pres_text}. История речи: {user_history}."
)

pres_processing_prompt = (
    "Вот структура презентации в формате словаря: {номер_слайда: [текст]}. Проанализируй каждый "
    "слайд отдельно. Для каждого слайда выдели ключевые аспекты: краткое описание, "
    "тип контента, основные термины или идеи. Также включи оригинальный текст слайда. Верни "
    "результат в виде корректного JSON, где каждый элемент описывает один слайд. Не добавляй "
    "пояснений и лишнего текста — только чистый JSON."
)


class GigachatSender:
    giga_instance = GigaChat(
        credentials=GIGACHAT_API_KEY, verify_ssl_certs=False, model="GigaChat-2"
    )

    user_history = []

    def __init__(self, pres_text):
        try:
            self.text_queue = asyncio.Queue()
            self.pres_text = pres_text
            message = [
                SystemMessage(content=pres_processing_prompt),
                HumanMessage(content=str(pres_text)),
            ]
            respond = self.giga_instance.invoke(message)
            logger.info(respond.content)
            self.pres_processed = respond.content
        except Exception as e:
            logger.error("Giga presentation processing error: %s", e)

    async def add_text(self, text):
        # if text is not str:
        #     raise ValueError('argument should be string')
        await self.text_queue.put(text)

    def start_text_processing(self):
        asyncio.create_task(self.__text_processing())

    async def __text_processing(self):
        logger.info("Gigachat text processing started")
        while True:
            user_text = str(await self.text_queue.get())

            if user_text == "":
                logger.info("Gigachat: ignoring empty transcription")
                continue

            prompt_format = slides_prompt.format(
                pres_text=self.pres_processed, user_history=self.user_history
            )
            message = [
                SystemMessage(content=prompt_format),
                HumanMessage(content=user_text),
            ]
            respond = self.giga_instance.invoke(message)
            logger.info("Gigachat respond for '%s' is %s", user_text, respond.content)
            self.user_history.append(user_text)
            try:
                slides_probs = literal_eval(respond.content)
                await presentation_handler.slides_queue.put(slides_probs)
            except Exception:
                logger.error("Wrong Gigachat output format")
