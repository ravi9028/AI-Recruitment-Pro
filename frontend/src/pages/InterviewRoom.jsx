import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function InterviewRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const apiRef = useRef();
  const token = localStorage.getItem("token");

  const [model, setModel] = useState(null);
  const [lastFlagTime, setLastFlagTime] = useState(0);

  // 🚀 AUTOMATED FLAGGING LOGIC (Sends Data to Backend)
  const flagSuspiciousActivity = async (type, reason) => {
    const now = Date.now();
    // 🛡️ Cooldown: Prevent spamming the API (limit 1 alert per 5 seconds for visuals)
    if (now - lastFlagTime < 5000) return;

    try {
      setLastFlagTime(now);
      // Extract Application ID from Room Name (e.g., "Interview-15-xyz" -> "15")
      const appId = roomName.split('-')[1];

      await fetch(`http://localhost:5000/api/applications/${appId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            type: type,   // "tab_switch", "multiple_faces", etc.
            reason: reason
        })
      });
      console.log(`🚩 Sent Alert: ${reason}`);
    } catch (err) {
      console.error("Flagging failed", err);
    }
  };

  // 🛡️ 1. DETECT TAB SWITCHING
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Immediate Alert (No Cooldown for Tab Switching)
        const appId = roomName.split('-')[1];
        fetch(`http://localhost:5000/api/applications/${appId}/flag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: "tab_switch", reason: "Candidate switched tabs" })
        });
        alert("⚠️ WARNING: Tab switching is monitored. Your trust score has been reduced.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomName, token]);

  // 🤖 2. AI PROCTORING (Vision & Audio)
  useEffect(() => {
    let detectionInterval;
    let stream;
    let audioContext;
    let isMounted = true;

    const startProctoring = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        if (!isMounted) return;

        setModel(loadedModel);
        console.log("✅ AI Proctoring Model Loaded");

        // Setup hidden video for AI analysis
        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        video.width = 640;
        video.height = 480;

        // Request Access
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;

        // Audio Analysis Setup
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        video.onloadedmetadata = () => { video.play(); };

        // Start Detection Loop
        video.onloadeddata = () => {
          if (!isMounted) return;

          detectionInterval = setInterval(async () => {
            if (video && loadedModel && video.readyState === 4) {

              // A. Visual Detection
              const predictions = await loadedModel.detect(video, 20, 0.3);
              const persons = predictions.filter(p => p.class === 'person');

              // B. Audio Volume Calculation
              analyser.getByteFrequencyData(dataArray);
              const sum = dataArray.reduce((a, b) => a + b, 0);
              const volume = Math.round(sum / bufferLength);

              console.log(`🛡️ Scan: Persons=${persons.length}, Volume=${volume}`);

              // 🚩 C. ENHANCED SECURITY LOGIC

              // 1. Multiple People Detected
              if (persons.length > 1) {
                flagSuspiciousActivity("multiple_faces", "Visual: Multiple persons detected");
              }
              // 2. No Person Detected (Candidate Left)
              else if (persons.length === 0) {
                if (volume > 20) {
                   flagSuspiciousActivity("no_face", "Critical: Audio detected while candidate missing (Proxy Suspected)");
                } else {
                   flagSuspiciousActivity("no_face", "Visual: No candidate detected");
                }
              }
              // 3. Audio Coaching (1 Person + High Volume)
              else if (persons.length === 1) {
                 if (volume > 40) {
                    flagSuspiciousActivity("multiple_voices", "Audio: High conversation volume (Potential Coaching)");
                 }
              }
            }
          }, 5000); // Check every 5 seconds
        };
      } catch (err) {
        console.error("AI Camera/Mic access failed:", err);
      }
    };

    startProctoring();

    // Cleanup
    return () => {
      isMounted = false;
      if (detectionInterval) clearInterval(detectionInterval);
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
      if (stream) {
        stream.getTracks().forEach(track => { track.stop(); });
      }
    };
  }, [roomName]); // Added dependencies to ensure it runs correctly on room change

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col font-sans">
      {/* HEADER */}
      <div className="p-2 md:p-4 bg-slate-800 text-white flex justify-between items-center shadow-xl border-b border-slate-700">
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-sm md:text-lg font-bold uppercase tracking-tight hidden sm:block">
            AI Recruitment Pro
          </h2>
          <div className="flex items-center gap-2 bg-slate-900 px-2 md:px-3 py-1 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[9px] md:text-[10px] text-green-400 font-mono uppercase font-bold tracking-widest">
              <span className="md:hidden">Active</span>
              <span className="hidden md:inline">AI Proctoring Active</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/candidate/dashboard')}
          className="px-3 md:px-6 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs font-bold rounded shadow-md active:scale-95 whitespace-nowrap"
        >
          LEAVE <span className="hidden md:inline">INTERVIEW</span>
        </button>
      </div>

      {/* JITSI MEETING */}
      <div className="flex-grow relative bg-black">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false
          }}
          onApiReady={(externalApi) => {
            apiRef.current = externalApi;
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat',
            ],
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
        />
      </div>
    </div>
  );
}