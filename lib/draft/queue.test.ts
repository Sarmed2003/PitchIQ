import { beforeEach, describe, expect, it } from "vitest";
import { addToQueue, getQueue, isQueued, moveInQueue, removeFromQueue, setQueue } from "./queue";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(i: number) {
    return [...this.store.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  // Stub a window + localStorage in node so the helpers can run.
  (globalThis as unknown as { window: { localStorage: Storage } }).window = {
    localStorage: new MemoryStorage(),
  };
  (globalThis as unknown as { localStorage: Storage }).localStorage = (
    globalThis as unknown as { window: { localStorage: Storage } }
  ).window.localStorage;
});

describe("draft queue helpers", () => {
  const T = "team-abc";

  it("starts empty", () => {
    expect(getQueue(T)).toEqual([]);
  });

  it("adds, dedupes, and removes", () => {
    addToQueue(T, 1);
    addToQueue(T, 2);
    addToQueue(T, 1); // dedupe
    expect(getQueue(T)).toEqual([1, 2]);
    removeFromQueue(T, 1);
    expect(getQueue(T)).toEqual([2]);
  });

  it("isQueued reflects state", () => {
    addToQueue(T, 5);
    expect(isQueued(T, 5)).toBe(true);
    expect(isQueued(T, 6)).toBe(false);
  });

  it("moves up and down", () => {
    setQueue(T, [10, 20, 30]);
    moveInQueue(T, 30, -1);
    expect(getQueue(T)).toEqual([10, 30, 20]);
    moveInQueue(T, 10, 1);
    expect(getQueue(T)).toEqual([30, 10, 20]);
  });

  it("ignores out-of-bounds moves", () => {
    setQueue(T, [1, 2]);
    moveInQueue(T, 1, -1);
    expect(getQueue(T)).toEqual([1, 2]);
    moveInQueue(T, 2, 1);
    expect(getQueue(T)).toEqual([1, 2]);
  });
});
