from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
import edge_tts
import asyncio
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expanded Voice Mapping for maximum reliability
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

@app.get("/tts")
async def tts(text: str = Query(...), lang: str = Query(...)):
    print(f"TTS Request: lang={lang}, text={text[:20]}...")
    
    # Extract primary lang code (e.g., 'en-US' -> 'en')
    primary_lang = lang.split('-')[0].lower()
    voice = VOICE_MAPPING.get(primary_lang, "en-US-AriaNeural")
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        if not audio_data:
            raise Exception("No audio data generated")
            
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return Response(content=str(e), status_code=500)

if __name__ == "__main__":
    import uvicorn
    # Use port 8001 to avoid conflicts
    uvicorn.run(app, host="0.0.0.0", port=8001)