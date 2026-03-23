const MAX_SPEED = 0.001;

/**
 * Represents a single firefly
 */
export class Firefly {
  positionX: number = 0;
  positionY: number = 0;
  movementX: number = 0;
  movementY: number = 0;
  element: HTMLDivElement = document.createElement('div');
  isBright: boolean = false;
  private activeTriggers = new Map<number, HTMLDivElement>();
  private static nextTriggerId = 0;

  constructor() {
    this.positionX = Math.random();
    this.positionY = Math.random();
    this.movementX = (Math.random() - 0.5) / 1000;
    this.movementY = (Math.random() - 0.5) / 1000;
    this.generateElement();
  }

  /**
   * Shift the firefly by its movement params
   * Shift the movement params slightly so it's aimless
   * Ensure the MAX_SPEED is obeyed.
   */
  tickMovement() {
    this.positionX += this.movementX;
    this.positionY += this.movementY;
    this.setElementPosition();

    this.movementX += (Math.random() - 0.5) / 1000;
    this.movementY += (Math.random() - 0.5) / 1000;

    const speed = Math.hypot(this.movementX, this.movementY);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      this.movementX *= scale;
      this.movementY *= scale;
    }
  }

  /**
   * Generates the html element for the fly and sets initial position
   */
  generateElement(): void {
    this.element.className = 'firefly';
    this.setElementPosition();
  }

  /**
   * Applies the firefly position with translate() by vw and vh
   */
  private setElementPosition(): void {
    this.element.style.transform = `translate(${this.positionX * 100}vw, ${this.positionY * 100}vh)`;
  }

  /**
   * Adds a trigger state to the fly. It can have several that get removed individually.
   * @param color the color of the trigger state
   * @param intensity the intensity of the trigger (dictated by distance from click event)
   * @returns the id of the trigger
   */
  addTrigger(color: string, intensity: number): number {
    const id = Firefly.nextTriggerId++;
    const layer = document.createElement('div');

    layer.className = 'trigger-layer';
    layer.style.setProperty('--trigger-color', color);
    layer.style.setProperty('--trigger-intensity', intensity.toFixed(2));
    this.element.appendChild(layer);
    this.activeTriggers.set(id, layer);

    // nested rAF ensures the new child gets its fade in animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layer.classList.add('visible');
      });
    });
    return id;
  }

  /**
   * removes the trigger state by id
   * @param id
   * @returns
   */
  removeTrigger(id: number): void {
    const layer = this.activeTriggers.get(id);
    if (!layer) {
      return;
    }

    this.activeTriggers.delete(id);
    layer.classList.remove('visible');
    layer.classList.add('fading');
    setTimeout(() => layer.remove(), 800);
  }

  /**
   * toggles the flicker state of the fly (brighter or normal)
   * @returns
   */
  flicker(): void {
    if (this.activeTriggers.size > 0) {
      return;
    }

    this.isBright = !this.isBright;
    if (this.isBright) {
      this.element.classList.remove('bright-out');
      this.element.classList.add('bright');
    } else {
      this.element.classList.remove('bright');
      this.element.classList.add('bright-out');
      setTimeout(() => this.element.classList.remove('bright-out'), 1000);
    }
  }
}
