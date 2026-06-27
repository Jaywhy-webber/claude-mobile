const MAX_SIZE = 50 * 1024; // 50KB

export class ScrollbackBuffer {
  private buffer = Buffer.alloc(MAX_SIZE);
  private head = 0;
  private length = 0;

  append(data: Buffer): void {
    if (data.length >= MAX_SIZE) {
      data.copy(this.buffer, 0, data.length - MAX_SIZE);
      this.head = 0;
      this.length = MAX_SIZE;
      return;
    }

    const writePos = (this.head + this.length) % MAX_SIZE;
    const spaceAtEnd = MAX_SIZE - writePos;

    if (data.length <= spaceAtEnd) {
      data.copy(this.buffer, writePos);
    } else {
      data.copy(this.buffer, writePos, 0, spaceAtEnd);
      data.copy(this.buffer, 0, spaceAtEnd);
    }

    const newLength = this.length + data.length;
    if (newLength > MAX_SIZE) {
      this.head = (this.head + (newLength - MAX_SIZE)) % MAX_SIZE;
      this.length = MAX_SIZE;
    } else {
      this.length = newLength;
    }
  }

  replay(): Buffer {
    if (this.length === 0) {
      return Buffer.alloc(0);
    }

    const result = Buffer.alloc(this.length);
    const firstChunk = Math.min(this.length, MAX_SIZE - this.head);
    this.buffer.copy(result, 0, this.head, this.head + firstChunk);

    if (firstChunk < this.length) {
      this.buffer.copy(result, firstChunk, 0, this.length - firstChunk);
    }

    return result;
  }
}
