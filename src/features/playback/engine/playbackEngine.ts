import { gsap } from 'gsap'
import type { Track } from '../../../shared/types/editor'
import { clamp, getPlaybackDuration, MIN_ELEMENT_DURATION } from '../utils/timeline'

type PlaybackEngineCallbacks = {
  onUpdate?: (time: number) => void
  onComplete?: () => void
}

export class PlaybackEngine {
  private masterTimeline: gsap.core.Timeline | null = null
  private callbacks: PlaybackEngineCallbacks
  private duration = 0

  constructor(callbacks: PlaybackEngineCallbacks = {}) {
    this.callbacks = callbacks
  }

  buildFromTracks(tracks: Track[], projectDuration: number): void {
    this.destroy()

    this.duration = getPlaybackDuration(projectDuration, tracks)
    const master = gsap.timeline({ paused: true, defaults: { ease: 'none' }, smoothChildTiming: false })

    if (this.duration > 0) {
      master.to({}, { duration: this.duration }, 0)
    }

    for (const track of tracks) {
      const trackTimeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      const sortedElements = [...track.elements].sort((a, b) => a.startTime - b.startTime)

      for (const element of sortedElements) {
        const startTime = clamp(element.startTime, 0, this.duration)
        const availableDuration = Math.max(this.duration - startTime, MIN_ELEMENT_DURATION)
        const duration = Math.min(Math.max(element.duration, MIN_ELEMENT_DURATION), availableDuration)
        trackTimeline.to({}, { duration }, startTime)
      }

      master.add(trackTimeline, 0)
    }

    master.eventCallback('onUpdate', () => {
      this.callbacks.onUpdate?.(master.time())
    })

    master.eventCallback('onComplete', () => {
      this.callbacks.onComplete?.()
    })

    this.masterTimeline = master
  }

  play(): void {
    if (!this.masterTimeline || this.duration <= 0) {
      return
    }

    this.masterTimeline.play()
  }

  pause(): void {
    this.masterTimeline?.pause()
  }

  seek(time: number): void {
    if (!this.masterTimeline) {
      return
    }

    const clampedTime = clamp(time, 0, this.duration)
    this.masterTimeline.time(clampedTime, false)
  }

  getDuration(): number {
    return this.duration
  }

  destroy(): void {
    if (!this.masterTimeline) {
      return
    }

    this.masterTimeline.kill()
    this.masterTimeline = null
  }
}
