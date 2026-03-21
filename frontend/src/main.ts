import './styles/main.scss';
import { Socket } from './socket';
import { FireflyControl } from './fireflyControl';
import { ClickEvent } from './types';

const TARGET_COUNT = 200;

const mainEl = document.getElementById('main') as HTMLDivElement;
const control = new FireflyControl({
  targetCount: TARGET_COUNT,
  container: mainEl,
});
const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const socket = new Socket({
  url: wsUrl,
  clickHandler: control.triggerClick.bind(control),
});

const colorButtons = document.getElementsByClassName('color-btn');
let currentColor =
  (colorButtons.item(0) as HTMLElement)?.dataset.color ?? '#ff6b6b';

const handleColorClick = (ev: PointerEvent) => {
  const btn = ev.currentTarget as HTMLElement;
  currentColor = btn.dataset.color ?? currentColor;
  for (let i = 0; i < colorButtons.length; i++) {
    colorButtons.item(i)?.classList.remove('active');
  }
  btn.classList.add('active');
};

for (let i = 0; i < colorButtons.length; i++) {
  const colorBtn = colorButtons.item(i) as HTMLDivElement;
  if (!colorBtn) continue;
  colorBtn.onclick = handleColorClick;
}

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

control.start();
