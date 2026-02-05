import type { WebSocketMessage } from "@liberos/caf-shared"
import { WebSocketMessageSchema } from "@liberos/caf-shared"

export type MessageHandler = (message: WebSocketMessage) => void

export class CAFWebSocketClient {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private url: string = ""

  connect(url: string): void {
    this.url = url
    this.ws = new WebSocket(url)
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        const message = WebSocketMessageSchema.parse(data)
        this.handlers.forEach((h) => h(message))
      } catch {
        // ignore parse errors
      }
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
