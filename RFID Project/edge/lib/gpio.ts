import { EventEmitter } from 'events';
import * as os from 'os';

export interface GPIOHandler extends EventEmitter {
  start(): void;
  stop(): void;
  emit(event: 'trigger', ...args: []): boolean;
}

// Real GPIO handler — Linux only, uses the `onoff` package.
class RealGPIOHandler extends EventEmitter implements GPIOHandler {
  private pin1: number;
  private pin2: number;
  private gpios: unknown[] = [];

  constructor(pin1: number, pin2: number) {
    super();
    this.pin1 = pin1;
    this.pin2 = pin2;
  }

  start() {
    // Dynamically require onoff to avoid import errors on non-Linux platforms
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Gpio } = require('onoff') as { Gpio: new (pin: number, dir: string, edge: string, cb: () => void) => unknown };

    const handler = () => this.emit('trigger');
    this.gpios = [
      new Gpio(this.pin1, 'in', 'rising', handler),
      new Gpio(this.pin2, 'in', 'rising', handler),
    ];

    console.log(`[GPIO] Listening on pins ${this.pin1}, ${this.pin2}`);
  }

  stop() {
    // @ts-expect-error — onoff Gpio has unexport()
    this.gpios.forEach((g) => g.unexport?.());
    this.gpios = [];
  }
}

// Stub GPIO handler — non-Linux platforms, emits a trigger every intervalMs.
export class StubGPIOHandler extends EventEmitter implements GPIOHandler {
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(intervalMs = 30_000) {
    super();
    this.intervalMs = intervalMs;
  }

  start() {
    console.log(`[GPIO] Stub mode — emitting mock trigger every ${this.intervalMs}ms`);
    this.timer = setInterval(() => {
      this.emit('trigger');
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

// Factory — returns the appropriate handler for the current platform.
export function createGPIOHandler(pin1: number, pin2: number, stubIntervalMs = 30_000): GPIOHandler {
  if (os.platform() === 'linux') {
    return new RealGPIOHandler(pin1, pin2);
  }
  return new StubGPIOHandler(stubIntervalMs);
}
