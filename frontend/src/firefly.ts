const MAX_SPEED = 0.001;

export class Firefly {
  positionX: number = 0;
  positionY: number = 0;
  movementX: number = 0;
  movementY: number = 0;
  element: HTMLDivElement = document.createElement('div');
  isBright: boolean = false;

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

  generateElement(): void {
    this.element.className = 'firefly';
    this.setElementPosition();
  }

  private setElementPosition(): void {
    this.element.style.transform = `translate(${this.positionX * 100}vw, ${this.positionY * 100}vh)`;
  }

  flicker(): void {
    if (this.element.classList.contains('triggered')) {
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
