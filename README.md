# AI Кликер by Cliqueuer

Интеллектуальный помощник для докладчиков, который может в режиме реального времени анализировать речь, понимать контекст и автоматически переключать слайды, а также генерировать и структурировать тезисы выступления.

Backend: Python, FastAPI, Aspose, langchain, OpenAI Whisper

Frontend: React

## Run backend

MacOS: `brew install mono-libgdiplus`

```bash
python -m venv venv
source venv/bin/activate
cd backend
pip install -r requirements.txt
python server.py
```

## Run frontend

```bash
cd frontend
npm install
npm start
```
