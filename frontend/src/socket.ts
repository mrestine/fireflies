import { ClickEvent } from './types';

interface SocketProps {
  url: string;
  clickHandler: (event: ClickEvent) => void;
}

/**
 * Wraps the usage of a websocket used to send/receive click events to/from others
 */
export class Socket {
  private ws: WebSocket;
  onClickEvent: ((e: ClickEvent) => void) | null = null;

  constructor({ url, clickHandler }: SocketProps) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ClickEvent;
        if (data.type === 'click') {
          clickHandler(data);
        }
      } catch {
        // ignore malformed messages
      }
    });
    this.ws.addEventListener('open', () => console.log('[ws] connected'));
    this.ws.addEventListener('close', () => console.log('[ws] disconnected'));
    this.ws.addEventListener('error', (e) => console.error('[ws] error', e));
  }

  send(event: ClickEvent): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }
}
