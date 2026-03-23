import './styles/main.scss';
import { Socket } from './socket';
import { FireflyControl } from './fireflyControl';
import { ClickEvent } from './types';
import { setupColorButtons } from './colorButtons';

const TARGET_COUNT = 200;
const COLORS = ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ffffff'];

// grab the main div element and initialize the fly controller
const mainEl = document.getElementById('main') as HTMLDivElement;
const control = new FireflyControl({
  targetCount: TARGET_COUNT,
  container: mainEl,
});

// websockets for feeding click events to other clients
const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const socket = new Socket({
  url: wsUrl,
  clickHandler: control.triggerClick.bind(control),
});

// toolbar color buttons
let currentColor = COLORS[0];
const handleColorClick = (color: string) => {
  currentColor = color;
};
setupColorButtons(COLORS, handleColorClick);

// main click handler for triggering firefly colors
mainEl.onclick = (ev: PointerEvent) => {
  const clickEvent: ClickEvent = {
    type: 'click',
    x: ev.x / innerWidth,
    y: ev.y / innerHeight,
    color: currentColor,
  };
  control.triggerClick(clickEvent);
  socket.send(clickEvent);
};

// sets up inital flies and start the main loop
control.start();
