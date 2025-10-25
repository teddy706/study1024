import React, { useState } from 'react'
import { VoIPService } from '../../services/calls/voip.service'
import { CallRecorder } from '../CallRecorder'

interface CallButtonProps {
  phoneNumber: string
  contactId: string
  onCallComplete?: (callId: string) => void
}

export const CallButton: React.FC<CallButtonProps> = ({
  phoneNumber,
  contactId,
  onCallComplete
}) => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const voipService = new VoIPService()

  const handleCall = async () => {
    try {
      const call = await voipService.initiateCall(phoneNumber)
      setCurrentCallId(call.id)
      setIsCallActive(true)
    } catch (error) {
      console.error('Error making call:', error)
    }
  }

  const handleEndCall = async () => {
    if (currentCallId) {
      try {
        await voipService.endCall(currentCallId)
        setIsCallActive(false)
        setCurrentCallId(null)
        if (onCallComplete) {
          onCallComplete(currentCallId)
        }
      } catch (error) {
        console.error('Error ending call:', error)
      }
    }
  }

  const handleRecordingComplete = (callId: string) => {
    if (onCallComplete) {
      onCallComplete(callId)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <a
        href={`tel:${phoneNumber}`}
        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={(e) => {
          e.preventDefault()
          if (!isCallActive) {
            handleCall()
          }
        }}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        {isCallActive ? '통화 중' : '전화 걸기'}
      </a>

      {isCallActive && (
        <>
          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            통화 종료
          </button>
          <CallRecorder
            contactId={contactId}
            onRecordingComplete={handleRecordingComplete}
          />
        </>
      )}
    </div>
  )
}