import csv
import logging
import statistics
from pathlib import Path

import gigachat_handler
import asyncio
from presentation_handler import extract_text, slides_queue, MIN_PROBABILITY, pres_status

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("gigachat_handler").setLevel(logging.WARNING)

GIGA_SLIDES_FIELD = "Слайды Gigachat"
MAE_FIELD = "MAE"
GIGA_PROBS_FIELD = "Вероятности Gigachat"


async def process_markup_csv():
    giga = gigachat_handler.GigachatSender(None)
    giga.start_text_processing()
    pres_status["isContextMode"] = True
    with (open("test_pres/markup.csv", encoding='utf-8', newline='') as csv_in,
          open("test_pres/result.csv", mode='w', newline='', encoding='utf-8') as csv_out):
        reader = csv.DictReader(csv_in)
        writer = csv.DictWriter(csv_out, reader.fieldnames + [GIGA_SLIDES_FIELD, MAE_FIELD, GIGA_PROBS_FIELD])
        writer.writeheader()

        block_count = err_sum = 0
        current_pres_id = 0
        switch_1_slide = switch_2_slide = switch_3_slide = 0

        for row in reader:
            pres_id = row["ID Презентации"]
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

                block_count = err_sum = 0
                switch_1_slide = switch_2_slide = switch_3_slide = 0

            if giga.pres_text is None:
                continue

            await giga.add_text(text)
            slide_number, probs = await process_giga_respond()

            if slide_number is not None:
                block_count += 1
                err_sum += abs(slide_number - (switch_1_slide + switch_2_slide + switch_3_slide) / 3.0)

                sign = lambda x, y: "+" if x > y else "-"
                diff = lambda switch: f"{sign(switch, slide_number)}{abs(switch - slide_number)}"

                row["Граница блока1"] = f"{switch_1_slide} ({diff(switch_1_slide)})"
                row["Граница блока2"] = f"{switch_2_slide} ({diff(switch_2_slide)})"
                row["Граница блока3"] = f"{switch_3_slide} ({diff(switch_3_slide)})"
                row[GIGA_SLIDES_FIELD] = slide_number
                row[MAE_FIELD] = "{:.2f}".format(err_sum / block_count)
                row[GIGA_PROBS_FIELD] = probs
            else:
                row["Граница блока1"] = switch_1_slide
                row["Граница блока2"] = switch_2_slide
                row["Граница блока3"] = switch_3_slide

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
        return None, None

    slide = max(slides_probs.items(), key=lambda x: x[1])
    if slide[1] >= MIN_PROBABILITY:
        return slide[0], slides_probs
    else:
        return None, slides_probs


asyncio.run(process_markup_csv())
