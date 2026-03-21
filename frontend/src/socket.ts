import { ClickEvent } from './types';

interface SocketProps {
  url: string;
  clickHandler: (event: ClickEvent) => void;
}

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
          //this.onClickEvent(data);
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
    console.log('should send click?');
    if (this.ws.readyState === WebSocket.OPEN) {
      console.log('yes');
      this.ws.send(JSON.stringify(event));
    }
  }
}
