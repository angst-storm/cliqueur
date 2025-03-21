from whisper import load_model
from torch.cuda import is_available as is_cuda_available

print("cuda available:", is_cuda_available())


def get_text():
    model = load_model("turbo", device="cuda:0")
    result = model.transcribe("audio.mp3")
    print("whisper result:\n", result["text"])
    return result["text"]


if __name__ == "__main__":
    get_text()
