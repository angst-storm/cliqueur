import asyncio
import logging

from langchain_core.messages import HumanMessage, SystemMessage

import presentation_handler
import os
from s3 import s3_resource, s3_client, BUCKET_NAME

from langchain_gigachat.chat_models import GigaChat

from ast import literal_eval

GIGACHAT_API_KEY = os.getenv("GIGACHAT_API_KEY")
GIGACHAT_BYPASS_WAIT = 10

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
    "Вот структура презентации в формате словаря: {номер_слайда: {text: [текст], images: {...}}}. "
    "Проанализируй каждый слайд отдельно. Используй как текст слайда, так и результат анализа изображения. "
    "Для каждого слайда определи: краткое описание, тип содержимого, ключевые идеи и понятия. "
    "Верни результат в JSON, без пояснений — только данные по слайдам."
)


class GigachatSender:
    _off_by_bypass = False
    _bypass_timer = None

    giga_instance = GigaChat(
        credentials=GIGACHAT_API_KEY, verify_ssl_certs=False, model="GigaChat-2"
    )

    user_history = []

    def __init__(self, pres_id):
        try:
            self.text_queue = asyncio.Queue()
            self.pres_id = pres_id
            self.pres_text = self.get_preprocess_text()
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
                pres_text=self.pres_text, user_history=self.user_history
            )
            message = [
                SystemMessage(content=prompt_format),
                HumanMessage(content=user_text),
            ]
            respond = self.giga_instance.invoke(message)
            logger.info("Gigachat respond for '%s' is %s", user_text, respond.content)
            self.user_history.append(user_text)

            if not presentation_handler.pres_status['isContextMode'] or self._off_by_bypass:
                continue

            try:
                slides_probs = literal_eval(respond.content)
                await presentation_handler.slides_queue.put(slides_probs)
            except Exception:
                logger.error("Wrong Gigachat output format")

    def turn_off_for_bypass(self):
        if self._off_by_bypass:
            logger.info("Reignoring giga")
            self._bypass_timer.cancel()
        else:
            logger.info(f"Ignoring giga for {GIGACHAT_BYPASS_WAIT} sec")
            self._off_by_bypass = True

        self._bypass_timer = asyncio.create_task(self._wait_for_timer())

    def get_preprocess_text(self):
        result = s3_client.get_object(Bucket = BUCKET_NAME, Key=f"{self.pres_id}/preprocess.json")
        return result['Body'].read().decode("utf-8")

    async def _wait_for_timer(self):
        await asyncio.sleep(GIGACHAT_BYPASS_WAIT)

        self._off_by_bypass = False
        logger.info("Giga continue")


class GigachatPresHandler:
    giga_instance = GigaChat(
        credentials=GIGACHAT_API_KEY, verify_ssl_certs=False, model="GigaChat-2"
    )

    def process_presentation(self, pres_text, pres_id):
        message = [
            SystemMessage(content=pres_processing_prompt),
            HumanMessage(content=str(pres_text)),
        ]
        respond = self.giga_instance.invoke(message)
        logger.info(respond.content)
        return respond.content
