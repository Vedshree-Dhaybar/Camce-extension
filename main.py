from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import yt_dlp
import subprocess
import whisper
from transformers import pipeline
import os

# ----------------------
# LOAD MODELS (FAST)
# ----------------------
whisper_model = whisper.load_model("tiny")  # faster
summarizer = pipeline("text2text-generation", model="google/flan-t5-small")

# ----------------------
# FASTAPI SETUP
# ----------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# REQUEST SCHEMA
# ----------------------
class RequestData(BaseModel):
    url: str
    start: int
    end: int

# ----------------------
# FUNCTIONS
# ----------------------

def download_audio(url):
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": "audio.%(ext)s",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
        }],
        "quiet": True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    return "audio.mp3"


def cut_audio(input_file, start, end):
    duration = min(end - start, 60)  # max 60 sec
    output_file = "cut_audio.mp3"

    command = [
        "ffmpeg",
        "-y",
        "-i", input_file,
        "-ss", str(start),
        "-t", str(duration),
        "-vn",
        output_file
    ]

    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_file


def transcribe(audio_file):
    result = whisper_model.transcribe(audio_file, task="translate")
    return result["text"]


def summarize(text):
    chunks = [text[i:i+400] for i in range(0, len(text), 400)]
    final = ""

    for chunk in chunks:
        prompt = "Summarize in short bullet points:\n" + chunk
        result = summarizer(prompt, max_length=80)
        final += result[0]["generated_text"] + " "

    return final


# ----------------------
# API ROUTE
# ----------------------
@app.post("/process")
def process_video(data: RequestData):
    try:
        print("Processing:", data)

        audio = download_audio(data.url)
        clipped = cut_audio(audio, data.start, data.end)

        text = transcribe(clipped)
        summary = summarize(text)

        # cleanup (important for Render)
        if os.path.exists("audio.mp3"):
            os.remove("audio.mp3")
        if os.path.exists("cut_audio.mp3"):
            os.remove("cut_audio.mp3")

        return {
            "transcript": text,
            "summary": summary
        }

    except Exception as e:
        return {"error": str(e)}