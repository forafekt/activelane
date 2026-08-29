import { reactive } from 'vue'
import type { DockPosition, DragPayload, InteractionState } from './types'

type DropHandler = (state: Readonly<InteractionState>) => void

export class DragController {
  readonly state = reactive<InteractionState>({
    phase: 'idle',
    payload: null,
    pointerId: null,
    x: 0,
    y: 0,
    targetGroupId: null,
    position: null,
    insertionIndex: null,
  })
  private origin = { x: 0, y: 0 }
  private source: HTMLElement | null = null
  private onDrop: DropHandler | null = null
  constructor(private readonly threshold = 6) {}

  press(event: PointerEvent, payload: DragPayload, onDrop: DropHandler) {
    if (event.button !== 0 || this.state.phase !== 'idle') return
    this.origin = { x: event.clientX, y: event.clientY }
    this.source = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    this.onDrop = onDrop
    Object.assign(this.state, {
      phase: 'pressed',
      payload,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      targetGroupId: null,
      position: null,
      insertionIndex: null,
    })
    this.source?.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', this.handleMove, true)
    window.addEventListener('pointerup', this.handleUp, true)
    window.addEventListener('pointercancel', this.handleCancel, true)
    window.addEventListener('blur', this.handleCancel)
    window.addEventListener('keydown', this.handleKey)
    this.source?.addEventListener('lostpointercapture', this.handleLostCapture)
  }
  target(
    groupId: string | null,
    position: DockPosition | null,
    insertionIndex: number | null = null,
  ) {
    if (this.state.phase !== 'dragging') return
    this.state.targetGroupId = groupId
    this.state.position = position
    this.state.insertionIndex = insertionIndex
  }
  cancel = () => this.finish('cancelled')
  dispose() {
    this.finish('cancelled')
  }
  private handleMove = (event: PointerEvent) => {
    if (event.pointerId !== this.state.pointerId) return
    this.state.x = event.clientX
    this.state.y = event.clientY
    if (
      this.state.phase === 'pressed' &&
      Math.hypot(event.clientX - this.origin.x, event.clientY - this.origin.y) >= this.threshold
    ) {
      this.state.phase = 'dragging'
      event.preventDefault()
    }
  }
  private handleUp = (event: PointerEvent) => {
    if (event.pointerId !== this.state.pointerId) return
    if (this.state.phase === 'dragging' && this.state.targetGroupId && this.state.position) {
      this.state.phase = 'dropping'
      this.onDrop?.({ ...this.state })
    }
    this.finish('idle')
  }
  private handleCancel = () => this.finish('cancelled')
  private handleLostCapture = () => {
    if (this.state.phase !== 'idle') this.finish('cancelled')
  }
  private handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.finish('cancelled')
  }
  private finish(phase: 'idle' | 'cancelled') {
    const source = this.source
    const pointerId = this.state.pointerId
    this.cleanup()
    if (pointerId !== null && source?.hasPointerCapture?.(pointerId))
      source.releasePointerCapture(pointerId)
    this.source = null
    this.onDrop = null
    Object.assign(this.state, {
      phase,
      payload: null,
      pointerId: null,
      targetGroupId: null,
      position: null,
      insertionIndex: null,
    })
    if (phase === 'cancelled')
      queueMicrotask(() => {
        if (this.state.phase === 'cancelled') this.state.phase = 'idle'
      })
  }
  private cleanup() {
    window.removeEventListener('pointermove', this.handleMove, true)
    window.removeEventListener('pointerup', this.handleUp, true)
    window.removeEventListener('pointercancel', this.handleCancel, true)
    window.removeEventListener('blur', this.handleCancel)
    window.removeEventListener('keydown', this.handleKey)
    this.source?.removeEventListener('lostpointercapture', this.handleLostCapture)
  }
}
