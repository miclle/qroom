import React, { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import { QNLocalAudioTrack, QNMicrophoneAudioTrack, QNRemoteAudioTrack } from "qnweb-rtc"


interface IAudioVolumeOptions {
  track: QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack
}

const AudioVolume = observer((options: IAudioVolumeOptions) => {

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {

    let frameID = 0

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const columns = 10
    const width = context.canvas.width
    const height = context.canvas.height
    const normalColor = "rgba(255, 255, 255, 0.45)"
    const activeColor = "#81D8D0"

    const animationFrameFunc = (ctx: CanvasRenderingContext2D) => {

      const volumeLevel = options.track.getVolumeLevel();

      // [0 ~ 1] -> [0 ~ columns]
      const volume = (volumeLevel || 0) * columns

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < columns; i += 1) {
        const w = width / (columns * 2 - 1)
        const h = height / columns * (i + 1)
        const x = w * i * 2
        const y = height - h
        ctx.fillStyle = volume < i ? normalColor : activeColor
        ctx.fillRect(x, y, w, h)
      }

      frameID = requestAnimationFrame(() => animationFrameFunc(ctx))
    }

    frameID = requestAnimationFrame(() => animationFrameFunc(context))

    return function cleanup() {
      cancelAnimationFrame(frameID)
    }
  }, [options.track])

  return (
    <canvas className="audio-wave" ref={canvasRef} width="76" height="20"></canvas>
  )
})

export default AudioVolume
