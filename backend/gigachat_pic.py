import logging
import tempfile

from gigachat import GigaChat
from io import BytesIO
import os

from aspose.slides import Presentation
from aspose.slides import GroupShape

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GIGACHAT_API_KEY_FOR_IMAGES = os.getenv("GIGACHAT_API_KEY_FOR_IMAGES")

prompt = """
На изображении — слайд презентации. Определи, какие на нём изображения, диаграммы или графики. Объясни, что они означают и зачем они включены. 
Игнорируй любую служебную информацию или вотермарки (например: 'Evaluation only. Created with Aspose.Slides for Python via .NET 25.4. Copyright 2004-2025 Aspose Pty Ltd.'). 
Ответ в формате JSON:
[
  {
    "тип": "фото / график / схема / иконка / другое",
    "описание": "что на нём изображено",
    "назначение": "какую информацию он передаёт в контексте слайда"
  }
]
"""


class GigachatPicHandler:
    giga = GigaChat(
        credentials=GIGACHAT_API_KEY_FOR_IMAGES, verify_ssl_certs=False, model="GigaChat-Pro"
    )

    def _iter_slide_images_aspose(self, pptx_path):
        pres = Presentation(pptx_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp_path = tmp.name

        try:
            for i, slide in enumerate(pres.slides):

                has_image = any(self._shape_contains_image(shape) for shape in slide.shapes)

                if not has_image:
                    logger.info(f"skipping slide {i}")
                    continue

                logger.info(f"Slide {i} with picture")
                image = slide.get_thumbnail(2.0, 2.0)
                image.save(tmp_path)

                with open(tmp_path, "rb") as f:
                    stream = BytesIO(f.read())
                    stream.name = f"slide_{i}.png"

                yield i, stream

        except Exception as e:
            logger.info(e)
        finally:
            os.remove(tmp_path)

    def _shape_contains_image(self, shape):
        # картинка
        if hasattr(shape, "picture_format") and shape.picture_format.picture is not None:
            return True

        # заливка
        if hasattr(shape, "fill_format"):
            fill = shape.fill_format
            if fill.fill_type.name == "Picture":
                return True

        # PictureFrame, я хз что это пусть будет
        if hasattr(shape, "shape_type") and shape.shape_type.name == "PictureFrame":
            return True

        # группа фигур
        if isinstance(shape, GroupShape):
            return any(self._shape_contains_image(subshape) for subshape in shape.shapes)

        return False

    def _process_image(self, file_id):
        message = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "attachments": [file_id]
                }
            ],
            "temperature": 0.1
        }
        result = self.giga.chat(message)
        return result.choices[0].message.content

    def process_aspose(self, pres_path) -> dict[int, str]:
        d = {}
        for i, image_bytes in self._iter_slide_images_aspose(pres_path):
            response = self.giga.upload_file(image_bytes)
            file_id = response.id_
            image_result = self._process_image(file_id)
            logger.info(image_result)
            d[i] = image_result
            self.giga.delete_file(file_id)
        return d
