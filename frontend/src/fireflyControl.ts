import { Firefly } from './firefly';
import { ClickEvent } from './types';

// Used for fading in/out a fly
const FADE_MS = 2000;
// Tick interval for the movement loop. The css transition on transform must match
// with computational headroom so the browser interpolates positions smoothly between ticks.
const TICK_MS = 150;
// How far the click event will trigger flies. 1.0 is the whole screen
const RIPPLE_RADIUS = 0.6;
const MAX_RIPPLE_DELAY = 1600;

interface ControlProps {
  targetCount: number;
  container: HTMLDivElement;
}

interface FlyWithDistance {
  fly: Firefly;
  distance: number;
}

/**
 * Responsible for just about everything that isn't fly-specific:
 * Spawning, despawning, flickering, trigger handling, OOB checks, ticking movement
 */
export class FireflyControl {
  private fireflies: Firefly[] = [];
  private targetCount: number = 0;
  private container: HTMLDivElement | null = null;
  private fading = new Set<Firefly>();
  private oobCursor = 0;

  constructor({ targetCount, container }: ControlProps) {
    this.targetCount = targetCount;
    this.container = container;
  }

  /**
   * Spawns the initial flies
   * starts the main loop interval to tick fly movement
   * starts the random flicker handler (has its own random delay)
   * starts the random spawn handler (has its own random delay)
   */
  start(): void {
    const initalFlyAdding = setInterval(() => {
      if (this.fireflies.length >= this.targetCount) {
        clearInterval(initalFlyAdding);
      }
      this.addFly();
    }, 50);
    setInterval(() => this.mainLoop(), TICK_MS);
    this.randomFlickerHandler();
    this.randomSpawnHandler();
  }

  /**
   * Ticks movement of the flies every TICK_MS
   * movement is animated by css with an anim duration a little higher than TICK_MS
   * Also does an OOB check on some flies
   *
   * Not relying on requestAnimationFrame() here gives more control over fly speeds
   */
  private mainLoop(): void {
    this.fireflies.forEach((f) => f.tickMovement());
    this.removeOutOfBounds();
  }

  /**
   * This will randomly spawn or despawn a fly
   * It will be more likely to spawn one if fly count < target count
   * Random delay to next random spawn handler call
   */
  private randomSpawnHandler(): void {
    const activeCount = this.fireflies.length - this.fading.size;
    const diff = this.targetCount - activeCount;
    // Math.tanh maps diff smoothly to (-1, 1):
    //   diff=0  -> pAdd=0.5 (coin flip)
    //   diff=2  -> pAdd≈0.96 (strongly add)
    //   diff=-2 -> pAdd≈0.04 (strongly remove)
    const probabilityToAdd = (1 + Math.tanh(diff)) / 2;

    if (Math.random() < probabilityToAdd) {
      this.addFly();
    } else {
      this.removeRandomFly();
    }

    const delay = 100 + Math.random() * 2400;
    setTimeout(() => {
      this.randomSpawnHandler();
    }, delay);
  }

  /**
   * Adds a new fly by pushing it to this.fireflies,
   * appending it to the container, and fading it in
   */
  private addFly(): void {
    if (!this.container) {
      return;
    }
    const fly = new Firefly();
    this.container.appendChild(fly.element);
    this.fireflies.push(fly);
    // nested rAF: first frame allows new el with opacity 0, then fade to opacity 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fly.element.style.opacity = '1';
      });
    });
  }

  /**
   * Will pick a random fly that isn't currently fading to toggle the flicker effect
   * (flicker is just a slight increase in brightness)
   */
  private randomFlickerHandler(): void {
    const candidates = this.fireflies.filter((f) => !this.fading.has(f));
    if (candidates.length === 0) {
      return;
    }
    const fly = candidates[Math.floor(Math.random() * candidates.length)];
    fly.flicker();

    const delay = 100 + Math.random() * 2400;
    setTimeout(() => {
      this.randomFlickerHandler();
    }, delay);
  }

  /**
   * Picks a fly to fade out and remove that isn't already fading
   */
  private removeRandomFly(): void {
    const candidates = this.fireflies.filter((f) => !this.fading.has(f));
    if (candidates.length === 0) {
      return;
    }
    const fly = candidates[Math.floor(Math.random() * candidates.length)];
    this.fadeOut(fly);
  }

  /**
   * Handles fly despawning, be it by random despawn or oob
   * Adds to this.fading, applies opacity, removes el and this.fading entry after timer.
   */
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
   * Removes flies that have gone too far outside the viewport.
   * Checks 10 flies per frame using a rolling cursor. checks don't need to be aggressive
   * No mutation worries because fadeOut makes a new array with .filter()
   * async because the cursor reads this.fireflies.length fresh each call.
   */
  removeOutOfBounds(): void {
    const total = this.fireflies.length;
    if (total === 0) {
      return;
    }

    const end = Math.min(this.oobCursor + 10, total);
    for (let i = this.oobCursor; i < end; i++) {
      const fly = this.fireflies[i];
      if (
        fly.positionX > 1.1 ||
        fly.positionX < -0.1 ||
        fly.positionY > 1.1 ||
        fly.positionY < -0.1
      ) {
        if (!this.fading.has(fly)) {
          this.fadeOut(fly);
        }
      }
    }

    this.oobCursor = end >= total ? 0 : end;
  }

  /**
   * Gets all flies within a radius of a click event.
   * The distance is normalized by the screen's aspect ratio, so it always appears as a circle.
   * @param param0 x and y of the click event
   * @returns an array of flies and their distance from the event
   */
  private getFliesNearEvent({ x, y }: ClickEvent): Array<FlyWithDistance> {
    const result: Array<FlyWithDistance> = [];
    const aspectRatio = window.innerWidth / window.innerHeight;
    this.fireflies.forEach((fly) => {
      const distance = Math.hypot(
        (fly.positionX - x) * aspectRatio,
        fly.positionY - y,
      );
      if (distance < RIPPLE_RADIUS) {
        result.push({ fly, distance });
      }
    });
    return result;
  }

  /**
   * Applies the triggered status to all flies in the click radius.
   * The effect will be more delayed and less intense as it radiates out.
   * @param clickEvent
   */
  triggerClick(clickEvent: ClickEvent): void {
    const flies = this.getFliesNearEvent(clickEvent);

    flies.forEach(({ fly, distance }) => {
      // 0 at center, 1 at edge
      const t = distance / RIPPLE_RADIUS;
      const delay = t * MAX_RIPPLE_DELAY;
      // capped at 0.70 so two overlapping triggers add to ~1.1 without washing to white
      const intensity = (1 - t) * 0.7;

      // timer to remove the triggered state
      setTimeout(() => {
        const id = fly.addTrigger(clickEvent.color, intensity);
        setTimeout(() => fly.removeTrigger(id), 1200);
      }, delay);
    });
  }
}
