import { ClickEvent } from './types';

const RECONNECT_INTERVAL = 3000; // ms

interface SocketProps {
  url: string;
  clickHandler: (event: ClickEvent) => void;
}

/**
 * Wraps the usage of a websocket used to send/receive click events to/from others
 */
export class Socket {
  private url: string;
  private socket: WebSocket | null = null;
  onClickEvent: (e: ClickEvent) => void;

  constructor({ url, clickHandler }: SocketProps) {
    this.url = url;
    this.onClickEvent = clickHandler;
    this.initialize();
  }

  private initialize() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ClickEvent;
        if (data.type === 'click') {
          this.onClickEvent(data);
        }
      } catch {
        // ignore malformed messages
      }
    });
    this.socket.onopen = () => console.log('[ws] connected');
    this.socket.onclose = () => {
      console.log('[ws] disconnected. reconnecting in 3s');
      setTimeout(() => this.initialize(), RECONNECT_INTERVAL);
    };
    this.socket.onerror = (e) => console.error('[ws] error', e);
  }

  send(event: ClickEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }
}
