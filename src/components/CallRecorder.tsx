import React, { useState } from 'react'
import { WhisperService } from '../../services/stt/whisper.service'

interface CallRecorderProps {
  contactId: string
  onRecordingComplete: (callId: string) => void
}

export const CallRecorder: React.FC<CallRecorderProps> = ({ contactId, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const whisperService = new WhisperService()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
        
        try {
          const call = await whisperService.processCall(audioFile, contactId)
          onRecordingComplete(call.id)
        } catch (error) {
          console.error('Error processing recording:', error)
        }
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setAudioChunks([])
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full"
        >
          통화 녹음 시작
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full animate-pulse"
        >
          녹음 중지
        </button>
      )}
    </div>
  )
}