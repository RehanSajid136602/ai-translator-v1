from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
import edge_tts
import asyncio

app = FastAPI()

# Mapping of language codes to high-quality neural voices
VOICE_MAPPING = {
    "ar": "ar-SA-HamedNeural",
    "en": "en-US-AriaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "it": "it-IT-ElsaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "nl": "nl-NL-ColetteNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "hi": "hi-IN-SwaraNeural",
    "bn": "bn-IN-TanishaNeural",
    "ur": "ur-PK-AsadNeural",
    "pa": "pa-IN-GurmukhiNeural",
    "mr": "mr-IN-AarohiNeural",
    "te": "te-IN-ShrutiNeural",
    "ta": "ta-IN-PallaviNeural",
    "gu": "gu-IN-DhwaniNeural",
    "tr": "tr-TR-EmelNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "th": "th-TH-PremwadeeNeural",
    "id": "id-ID-GadisNeural",
    "ms": "ms-MY-YasminNeural",
    "tl": "tl-PH-JoannaNeural",
    "fa": "fa-IR-DilaraNeural",
    "sw": "sw-KE-RafikiNeural",
    "uk": "uk-UA-PolinaNeural",
    "el": "el-GR-AthinaNeural",
    "he": "he-IL-AvriNeural",
    "ro": "ro-RO-AlinaNeural",
    "pl": "pl-PL-ZofiaNeural",
}

@app.get("/api/tts")
async def tts(text: str = Query(...), lang: str = Query(...)):
    primary_lang = lang.split('-')[0].lower()
    voice = VOICE_MAPPING.get(primary_lang, "en-US-AriaNeural")
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        return Response(content=str(e), status_code=500)
