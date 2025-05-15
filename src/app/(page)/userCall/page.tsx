"use client"
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import styles from "./page.module.css"


export default function CallPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [targetUserId, setTargetUserId] = useState("");

  // Подключаемся к WebSocket и настраиваем WebRTC
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        newSocket.emit("ice-candidate", event.candidate, targetUserId);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    setPeerConnection(pc);

    // Обработка входящих звонков
    newSocket.on("offer", async (offer: RTCSessionDescriptionInit, senderId: string) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit("answer", answer, senderId);
    });

    newSocket.on("answer", async (answer: RTCSessionDescriptionInit) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    newSocket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      newSocket.disconnect();
      pc.close();
    };
  }, []);

  // Начало звонка
  const startCall = async () => {
    if (!peerConnection || !targetUserId) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket?.emit("offer", offer, targetUserId);
  };
  // const endCall = () => {
  //   peerConnection?.close();
  //   if (localVideoRef.current?.srcObject) {
  //     (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
  //   }
  // };
  return (
 

<div className={styles.main_Container}>
<div className={styles.mainFrame}>
<div>
      {/* <h1>Локальный P2P-звонок</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline width="400" />
        <video ref={remoteVideoRef} autoPlay playsInline width="400" />
      </div>
      <input
        type="text"
        value={targetUserId}
        onChange={(e) => setTargetUserId(e.target.value)}
        placeholder="Введите ID собеседника"
      />
      <button onClick={startCall}>Начать звонок</button> */}
      {/* <button onClick={endCall}>Закончить звонок</button> */}
    </div>
    
</div>
</div>
  );
}