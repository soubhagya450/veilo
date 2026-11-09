import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../services/socket";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * WebRTC 1-to-1 Voice & Video Call hook for private rooms.
 */
export function useWebRTC({ enabled = false, isConnected = false, partnerAlias = "Friend" } = {}) {
  // Call status: 'idle' | 'calling' | 'incoming' | 'connecting' | 'connected' | 'ended'
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState("voice"); // 'voice' | 'video'
  const [incomingCall, setIncomingCall] = useState(null); // { callerAlias, callType, callerSid }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const timerRef = useRef(null);
  const audioRingRef = useRef(null);

  // Synthesize call ringing and tone effects using Web Audio API
  const playTone = useCallback((type) => {
    try {
      if (audioRingRef.current) {
        audioRingRef.current.close().catch(() => {});
        audioRingRef.current = null;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioRingRef.current = ctx;

      if (type === "ringing") {
        // Periodic dual-frequency ringback tone (440Hz + 480Hz)
        let count = 0;
        const playRingCycle = () => {
          if (!audioRingRef.current || ctx.state === "closed") return;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);

          count++;
          if (count < 15) {
            setTimeout(playRingCycle, 3500);
          }
        };
        playRingCycle();
      } else if (type === "incoming") {
        // Melodic incoming call chime
        let count = 0;
        const playIncomingCycle = () => {
          if (!audioRingRef.current || ctx.state === "closed") return;
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.12);
            osc.stop(ctx.currentTime + idx * 0.12 + 0.2);
          });

          count++;
          if (count < 10) {
            setTimeout(playIncomingCycle, 2800);
          }
        };
        playIncomingCycle();
      } else if (type === "connected") {
        // Short pleasant ascending ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "ended") {
        // Descending hangup beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not permitted or failed
    }
  }, []);

  const stopAudioTone = useCallback(() => {
    if (audioRingRef.current) {
      try {
        audioRingRef.current.close().catch(() => {});
      } catch {}
      audioRingRef.current = null;
    }
  }, []);

  // Safely stop all tracks in a media stream
  const stopStream = useCallback((stream) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    } catch {}
  }, []);

  // Clean teardown of WebRTC peer connection and streams
  const cleanupCall = useCallback(() => {
    stopAudioTone();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      stopStream(localStreamRef.current);
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (remoteStreamRef.current) {
      stopStream(remoteStreamRef.current);
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    iceCandidatesQueueRef.current = [];
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setConnectionStatus("Disconnected");
    setIncomingCall(null);
  }, [stopAudioTone, stopStream]);

  // Request user media (audio only for voice, audio+video for video)
  const getUserMediaStream = useCallback(async (type) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera and microphone access requires HTTPS or localhost.");
    }

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        type === "video"
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: "user",
            }
          : false,
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  // Initialize and configure RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    iceCandidatesQueueRef.current = [];

    // Send generated ICE candidates to remote partner
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", { candidate: event.candidate });
      }
    };

    // Receive remote media track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Monitor peer connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setConnectionStatus("Connected");
        setCallStatus("connected");
        stopAudioTone();
        playTone("connected");

        // Start call duration timer
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (state === "connecting") {
        setConnectionStatus("Connecting...");
      } else if (state === "disconnected" || state === "failed") {
        setConnectionStatus("Reconnecting...");
      } else if (state === "closed") {
        setConnectionStatus("Call Ended");
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setConnectionStatus("Poor Connection");
      }
    };

    return pc;
  }, [playTone, stopAudioTone]);

  // Flush any queued ICE candidates once remote description is set
  const processQueuedCandidates = useCallback(async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    const queue = iceCandidatesQueueRef.current;
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add queued candidate:", err);
      }
    }
  }, []);

  // 1. Caller: Initiate Call
  const startCall = useCallback(
    async (type = "voice") => {
      if (!enabled || !isConnected) return;
      setErrorMessage(null);
      setCallType(type);
      setCallStatus("calling");
      setConnectionStatus("Calling...");
      setIsMinimized(false);

      try {
        const stream = await getUserMediaStream(type);
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Tell server to notify partner
        socket.emit("call_initiate", { callType: type });
        playTone("ringing");
      } catch (err) {
        console.error("Media permission error:", err);
        setCallStatus("idle");
        stopAudioTone();
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMessage("Permission denied. Please grant microphone and camera permissions in your browser.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setErrorMessage("No microphone or camera detected on your device.");
        } else {
          setErrorMessage(err.message || "Failed to start call.");
        }
      }
    },
    [enabled, isConnected, getUserMediaStream, playTone, stopAudioTone]
  );

  // 2. Callee: Accept Call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const type = incomingCall.callType || "voice";
    stopAudioTone();
    setErrorMessage(null);
    setCallStatus("connecting");
    setConnectionStatus("Connecting...");
    setCallType(type);

    try {
      const stream = await getUserMediaStream(type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socket.emit("call_accept", { callType: type });
      setIncomingCall(null);
    } catch (err) {
      console.error("Accept media error:", err);
      socket.emit("call_reject", { reason: "permission_denied" });
      cleanupCall();
      setCallStatus("idle");
      setErrorMessage("Permission denied. Could not access microphone or camera.");
    }
  }, [incomingCall, stopAudioTone, getUserMediaStream, createPeerConnection, cleanupCall]);

  // 3. Callee: Reject Call (or Caller: Cancel Outgoing Call)
  const rejectCall = useCallback(
    (reason = "declined") => {
      socket.emit("call_reject", { reason });
      cleanupCall();
      setCallStatus("idle");
    },
    [cleanupCall]
  );

  // 4. Either Peer: End Active Call
  const endCall = useCallback(() => {
    socket.emit("end_call", { reason: "hangup" });
    playTone("ended");
    cleanupCall();
    setCallStatus("ended");
    setTimeout(() => {
      setCallStatus("idle");
    }, 1500);
  }, [cleanupCall, playTone]);

  // 5. Toggle Mute (Microphone)
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const newMutedState = !isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  // 6. Toggle Video (Camera)
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const newVideoState = !isVideoEnabled;
      videoTracks.forEach((track) => {
        track.enabled = newVideoState;
      });
      setIsVideoEnabled(newVideoState);
    }
  }, [isVideoEnabled]);

  // 7. Toggle Minimization
  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Socket Signaling Event Listeners
  useEffect(() => {
    if (!enabled) return;

    // Incoming call from partner
    const handleCallIncoming = (data) => {
      if (callStatus !== "idle") {
        // Currently on a call, auto-reject with busy
        socket.emit("call_reject", { reason: "busy" });
        return;
      }
      setIncomingCall(data);
      setCallType(data.callType || "voice");
      setCallStatus("incoming");
      playTone("incoming");
    };

    // Caller acknowledges that callee phone is ringing
    const handleCallRinging = (data) => {
      setConnectionStatus("Ringing...");
    };

    // Callee accepted call -> Caller creates and sends WebRTC offer
    const handleCallAccepted = async (data) => {
      stopAudioTone();
      setCallStatus("connecting");
      setConnectionStatus("Establishing P2P link...");

      try {
        const pc = createPeerConnection();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current);
          });
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { sdp: offer, callType: data.callType || callType });
      } catch (err) {
        console.error("Error creating offer:", err);
        socket.emit("end_call", { reason: "offer_failed" });
        cleanupCall();
        setCallStatus("idle");
      }
    };

    // Caller receives WebRTC offer -> sets remote, creates answer, and sends
    const handleWebRTCOffer = async (data) => {
      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection();
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              pc.addTrack(track, localStreamRef.current);
            });
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await processQueuedCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { sdp: answer });
      } catch (err) {
        console.error("Error handling offer:", err);
        socket.emit("end_call", { reason: "answer_failed" });
        cleanupCall();
        setCallStatus("idle");
      }
    };

    // Receiver received WebRTC answer -> sets remote description
    const handleWebRTCAnswer = async (data) => {
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await processQueuedCandidates();
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    // Peer sent an ICE candidate
    const handleWebRTCIceCandidate = async (data) => {
      try {
        if (data.candidate) {
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            iceCandidatesQueueRef.current.push(data.candidate);
          }
        }
      } catch (err) {
        console.warn("Failed to add ICE candidate:", err);
      }
    };

    // Partner declined or cancelled
    const handleCallRejected = (data) => {
      stopAudioTone();
      playTone("ended");
      cleanupCall();
      setCallStatus("ended");
      const reason = data.reason || "declined";
      if (reason === "busy") {
        setErrorMessage("Partner is currently busy on another call.");
      } else {
        setErrorMessage("Call declined.");
      }
      setTimeout(() => {
        setCallStatus("idle");
      }, 2000);
    };

    // Partner ended call or left room
    const handleCallEnded = (data) => {
      stopAudioTone();
      playTone("ended");
      cleanupCall();
      setCallStatus("ended");
      setConnectionStatus("Call Ended");
      setTimeout(() => {
        setCallStatus("idle");
      }, 1500);
    };

    // Backend validation error
    const handleCallError = (data) => {
      stopAudioTone();
      cleanupCall();
      setCallStatus("idle");
      setErrorMessage(data.message || "Call error occurred.");
    };

    socket.on("call_incoming", handleCallIncoming);
    socket.on("call_ringing", handleCallRinging);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("call_error", handleCallError);

    return () => {
      socket.off("call_incoming", handleCallIncoming);
      socket.off("call_ringing", handleCallRinging);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("call_error", handleCallError);
    };
  }, [enabled, callStatus, callType, playTone, stopAudioTone, cleanupCall, createPeerConnection, processQueuedCandidates]);

  // Clean exit if component unmounts or private room closes
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callStatus,
    callType,
    incomingCall,
    isMuted,
    isVideoEnabled,
    callDuration,
    connectionStatus,
    errorMessage,
    isMinimized,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleMinimize,
    clearError: () => setErrorMessage(null),
  };
}
