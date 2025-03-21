from langchain_core.messages import HumanMessage, SystemMessage
from langchain_gigachat.chat_models import GigaChat
import whisper_test

giga = GigaChat(
    # Для авторизации запросов используйте ключ, полученный в проекте GigaChat API
    credentials="",
    verify_ssl_certs=False
)

messages = [
    SystemMessage(
        content="Верни краткую выжимку текста"
    )
]

text = whisper_test.get_text()
messages.append(HumanMessage(content=text))
result = giga.invoke(messages)
print(result.content)
