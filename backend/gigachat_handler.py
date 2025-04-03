import asyncio
import presentation_handler

from langchain_gigachat.chat_models import GigaChat
from ast import literal_eval

prompt = ("Дан текст слайдов и фрагмент речи спикера. Определи, к какому слайду относится речь, и верни 3 наиболее "
          "вероятных варианта с их вероятностями строго в формате: {{номер_слайда1: вероятность1, номер_слайда2: "
          "вероятность2, номер_слайда3: вероятность3}}. Текст слайдов: {slides_text}. Речь спикера: {user_text}.")

api_key = open('api_key.txt').readline()  # я не собираюсь пушить свой ключ


class GigachatSender:
    giga_instance = GigaChat(
        credentials=api_key,
        verify_ssl_certs=False,
    )

    def __init__(self, pres_text):
        self.pres_text = pres_text
        self.text_queue = asyncio.Queue()

    async def add_text(self, text: str):
        # if text is not str:
        #     raise ValueError('argument should be string')
        print(f"'{text}' queued")
        await self.text_queue.put(text)

    def start_text_processing(self):
        asyncio.create_task(self.__text_processing())

    async def __text_processing(self):
        print("Gigachat text processing started")
        while True:
            user_text = await self.text_queue.get()
            if user_text == '':
                print("Gigachat: ignoring empty transcription")
                continue
            print(f"'{user_text}' is processing")
            message = prompt.format(slides_text=self.pres_text, user_text=user_text)
            respond = self.giga_instance.invoke(message)
            print(f"Gigachat respond for '{user_text}' is {respond.content}")
            try:
                slides_probs = literal_eval(respond.content)
                await presentation_handler.slides_queue.put(slides_probs)
            except Exception:
                print(f"Wrong Gigachat output format")
