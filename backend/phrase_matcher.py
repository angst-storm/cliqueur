import re
from Levenshtein import distance as levenshtein_distance


def tokenize(text: str) -> list[str]:
    return re.findall(r'\w+', text.lower())


class PhraseMatcher:
    def __init__(self, match_threshold: float = 0.7, word_distance: int = 2):
        self.match_threshold = match_threshold
        self.word_distance = word_distance

    def compare(self, text: str, phrase: str) -> bool:
        text_words = tokenize(text)
        phrase_words = tokenize(phrase)

        if len(text_words) < len(phrase_words):
            return False

        for i in range(len(text_words) - len(phrase_words) + 1):
            window = text_words[i:i + len(phrase_words)]
            match_count = sum(
                1 for w1, w2 in zip(phrase_words, window)
                if levenshtein_distance(w1, w2) <= self.word_distance
            )
            match_ratio = match_count / len(phrase_words)
            if match_ratio >= self.match_threshold:
                return True
        return False
