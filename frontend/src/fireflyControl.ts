import { Firefly } from './firefly';
import { ClickEvent } from './types';

const FADE_MS = 2000;
const FLICKER_MS = 500;

// Tick interval for the movement loop. The CSS transition on top/left must match
// so the browser interpolates positions smoothly between ticks.
const TICK_MS = 150;
const RIPPLE_RADIUS = 0.6;

interface ControlProps {
  targetCount: number;
  container: HTMLDivElement;
}

export class FireflyControl {
  fireflies: Firefly[] = [];
  private targetCount: number = 0;
  private container: HTMLDivElement | null = null;
  private fading = new Set<Firefly>();
  private cursor = 0;

  constructor({ targetCount, container }: ControlProps) {
    this.targetCount = targetCount;
    this.container = container;
  }

  start() {
    setInterval(() => this.mainLoop(), TICK_MS);
    setInterval(() => this.flickerRandomFly(), FLICKER_MS);
    const initalFlyAdding = setInterval(() => {
      if (this.fireflies.length >= this.targetCount) {
        clearInterval(initalFlyAdding);
        this.schedule();
      }
      this.addFly();
    }, 50);
  }

  private mainLoop() {
    this.fireflies.forEach((f) => f.tickMovement());
    this.removeOutOfBounds();
  }

  private schedule(): void {
    const delay = 100 + Math.random() * 2400;
    setTimeout(() => {
      this.addOrRemove();
      this.schedule();
    }, delay);
  }

  private addOrRemove(): void {
    const activeCount = this.fireflies.length - this.fading.size;
    const diff = this.targetCount - activeCount;
    // Math.tanh maps diff smoothly to (-1, 1):
    //   diff=0  → pAdd=0.5 (coin flip)
    //   diff=2  → pAdd≈0.96 (strongly add)
    //   diff=-2 → pAdd≈0.04 (strongly remove)
    const pAdd = (1 + Math.tanh(diff)) / 2;

    if (Math.random() < pAdd) {
      this.addFly();
    } else {
      this.removeRandomFly();
    }
  }

  private addFly(): void {
    if (!this.container) {
      return;
    }
    const fly = new Firefly();
    this.container.appendChild(fly.element);
    this.fireflies.push(fly);
    // Double-rAF: first frame lets the browser paint opacity:0,
    // second frame sets opacity:1 so the CSS transition has a committed start point
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fly.element.style.opacity = '1';
      });
    });
  }

  /**
   * picks a fly to fade out and remove that isn't already fading
   */
  private flickerRandomFly(): void {
    const candidates = this.fireflies.filter((f) => !this.fading.has(f));
    if (candidates.length === 0) {
      return;
    }
    const fly = candidates[Math.floor(Math.random() * candidates.length)];
    fly.flicker();
  }

  private removeRandomFly(): void {
    const candidates = this.fireflies.filter((f) => !this.fading.has(f));
    if (candidates.length === 0) {
      return;
    }
    const fly = candidates[Math.floor(Math.random() * candidates.length)];
    this.fadeOut(fly);
  }

  private fadeOut(fly: Firefly): void {
    this.fading.add(fly);
    fly.element.style.opacity = '0';
    setTimeout(() => {
      fly.element.remove();
      this.fireflies = this.fireflies.filter((f) => f !== fly);
      this.fading.delete(fly);
    }, FADE_MS);
  }

  /**
   * Checks 10 flies per frame using a rolling cursor, so the cost is O(10) regardless
   * of swarm size. fadeOut() removes via filter (new array) after FADE_MS — safe to do
   * async because the cursor reads this.fireflies.length fresh each call.
   */
  removeOutOfBounds(): void {
    const total = this.fireflies.length;
    if (total === 0) return;

    const end = Math.min(this.cursor + 10, total);
    for (let i = this.cursor; i < end; i++) {
      const fly = this.fireflies[i];
      if (
        fly.positionX > 1.1 ||
        fly.positionX < -0.1 ||
        fly.positionY > 1.1 ||
        fly.positionY < -0.1
      ) {
        if (!this.fading.has(fly)) {
          console.log('### removing oob', this.fireflies.length);
          this.fadeOut(fly);
        }
      }
    }

    this.cursor = end >= total ? 0 : end;
  }

  private getFliesNearEvent({
    x,
    y,
  }: ClickEvent): Array<{ fly: Firefly; dist: number }> {
    const result: Array<{ fly: Firefly; dist: number }> = [];
    // Scale the X delta by the aspect ratio so both axes are in the same unit
    // (normalized viewport height). Without this, 0.1 units in X covers less
    // screen distance than 0.1 units in Y on a wide viewport, producing an ellipse.
    const ar = window.innerWidth / window.innerHeight;
    this.fireflies.forEach((fly) => {
      const dist = Math.hypot((fly.positionX - x) * ar, fly.positionY - y);
      if (dist < RIPPLE_RADIUS) {
        result.push({ fly, dist });
      }
    });
    return result;
  }

  triggerClick(clickEvent: ClickEvent): void {
    console.log('### got click', clickEvent);
    const flies = this.getFliesNearEvent(clickEvent);
    const RADIUS = RIPPLE_RADIUS;
    const MAX_RIPPLE_DELAY = 1600;

    flies.forEach(({ fly, dist }) => {
      // 0 at center, 1 at edge
      const t = dist / RADIUS;
      const delay = t * MAX_RIPPLE_DELAY;
      // closest flies get full intensity, edge flies barely change
      const intensity = 1 - t;

      setTimeout(() => {
        fly.element.style.setProperty('--trigger-color', clickEvent.color);
        fly.element.style.setProperty('--trigger-intensity', intensity.toFixed(2));
        fly.element.classList.add('triggered');
        setTimeout(() => {
          fly.element.classList.remove('triggered');
          fly.element.classList.add('triggered-out');
          fly.element.style.removeProperty('--trigger-intensity');
          // remove triggered-out and color after the ::after opacity transition (400ms)
          setTimeout(() => {
            fly.element.classList.remove('triggered-out');
            fly.element.style.removeProperty('--trigger-color');
          }, 400);
        }, 800);
      }, delay);
    });
  }
}
