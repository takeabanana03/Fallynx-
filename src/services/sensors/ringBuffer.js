// Fixed-size circular buffer. Holds the last N sensor samples so the
// detector can look backwards in time without the array growing forever.
// Pure JavaScript, no dependencies.

export default class RingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = new Array(capacity);
    this.writeIndex = 0;
    this.length = 0;
  }

  push(item) {
    this.items[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.length < this.capacity) this.length += 1;
    return this;
  }

  // Oldest first.
  toArray() {
    if (this.length < this.capacity) return this.items.slice(0, this.length);
    return [
      ...this.items.slice(this.writeIndex),
      ...this.items.slice(0, this.writeIndex),
    ];
  }

  // Newest first. Cheaper than reversing toArray when you only need a few.
  last(count = 1) {
    const out = [];
    for (let i = 0; i < Math.min(count, this.length); i += 1) {
      const index = (this.writeIndex - 1 - i + this.capacity) % this.capacity;
      out.push(this.items[index]);
    }
    return out;
  }

  // Every sample newer than `ms` milliseconds ago. Samples need a `t` field.
  since(ms, now = Date.now()) {
    return this.toArray().filter((sample) => now - sample.t <= ms);
  }

  get isFull() {
    return this.length === this.capacity;
  }

  clear() {
    this.items = new Array(this.capacity);
    this.writeIndex = 0;
    this.length = 0;
  }
}
