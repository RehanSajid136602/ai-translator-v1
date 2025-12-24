import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ isRecording, stream }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (isRecording && stream) {
      startVisualizer();
    } else {
      stopVisualizer();
    }

    return () => stopVisualizer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, stream]);

  const startVisualizer = () => {
    if (!canvasRef.current || !stream) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const audioCtx = audioContextRef.current;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvasCtx.scale(dpr, dpr);

    const draw = () => {
      if (!isRecording) return;
      
      requestRef.current = requestAnimationFrame(draw);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = rect.width;
      const height = rect.height;
      
      canvasCtx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Dynamic color based on theme (simplified here, but could accept props)
        // Using the primary/accent color logic from CSS
        const alpha = barHeight / 100;
        canvasCtx.fillStyle = `rgba(139, 92, 246, ${alpha})`; // Purple accent
        
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopVisualizer = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    // We don't close the context here to allow reuse, 
    // but we could disconnect the source if needed.
    // Ideally, the stream is stopped by the parent.
  };

  return (
    <canvas 
      ref={canvasRef} 
      className={`audio-visualizer ${isRecording ? 'active' : ''}`}
      style={{
        position: 'absolute',
        bottom: '60px',
        left: 0,
        width: '100%',
        height: '40px',
        pointerEvents: 'none',
        opacity: isRecording ? 0.6 : 0,
        transition: 'opacity 0.3s'
      }}
    />
  );
};

export default AudioVisualizer;
