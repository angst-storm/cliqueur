import csv
from pathlib import Path

import gigachat_handler
import asyncio
from presentation_handler import extract_text, slides_queue, MIN_PROBABILITY, pres_status

GIGA_SLIDES_FIELD_NAME = "Слайды Gigachat"
GIGA_PROBS_FIELD_NAME = "Вероятности Gigachat"


async def process_markup_csv():
    giga = gigachat_handler.GigachatSender("")
    giga.start_text_processing()
    pres_status["isContextMode"] = True
    with (open("test_pres/markup.csv", encoding='utf-8', newline='') as csv_in,
          open("test_pres/result.csv", mode='w', newline='', encoding='utf-8') as csv_out):
        reader = csv.DictReader(csv_in)
        writer = csv.DictWriter(csv_out, reader.fieldnames + [GIGA_SLIDES_FIELD_NAME, GIGA_PROBS_FIELD_NAME])
        writer.writeheader()
        current_pres_id = 0
        switch_1_slide = switch_2_slide = switch_3_slide = 0
        for row in reader:
            pres_id = row["ID Презентации"]
            block_id = row["ID Блока"]
            text = row["Текст"]
            switch_1 = row["Граница блока1"]
            switch_2 = row["Граница блока2"]
            switch_3 = row["Граница блока3"]
            switch_1_slide += int(switch_1)
            switch_2_slide += int(switch_2)
            switch_3_slide += int(switch_3)

            if pres_id != current_pres_id:
                giga.pres_text = get_new_pres_text(pres_id)
                giga.reset_history()
                current_pres_id = pres_id
                switch_1_slide = switch_2_slide = switch_3_slide = 0

            if giga.pres_text is None:
                continue

            await giga.add_text(text)
            slide_number, probs = await process_giga_respond()
            row["Граница блока1"] = switch_1_slide
            row["Граница блока2"] = switch_2_slide
            row["Граница блока3"] = switch_3_slide
            row[GIGA_SLIDES_FIELD_NAME] = slide_number
            row[GIGA_PROBS_FIELD_NAME] = probs
            writer.writerow(row)


def get_new_pres_text(pres_id):
    pres_files = list(Path("test_pres").glob('*.pptx'))
    for f in pres_files:
        name = f.name
        if name.split('_')[0] == str(pres_id):
            pres_path = f.joinpath()
            print(f"Pres {pres_id} found: {pres_path}")
            return process_presentation(pres_path)

    print(f"Pres {pres_id} not found")
    return None


def process_presentation(pres_path):
    slides_text = extract_text(pres_path)
    print(slides_text, end='\n\n')
    giga_proc = gigachat_handler.GigachatPresHandler()
    preprocess_text = giga_proc.process_presentation(slides_text)
    print(preprocess_text)
    return preprocess_text


async def process_giga_respond():
    slides_probs = await slides_queue.get()
    if not slides_probs:
        print("Slides: skipping empty dict")
        return None

    slide = max(slides_probs.items(), key=lambda x: x[1])
    print(f"Top slide is {slide}")
    if slide[1] >= MIN_PROBABILITY:
        print(f"Giga slide pick: {slide[0]}")
        return slide[0], slides_probs
    else:
        return None, slides_probs


asyncio.run(process_markup_csv())
