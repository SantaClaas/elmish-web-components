type Writable<TItem> = {
  type: "writable";
  // WX??? write exclusive????
  items: Array<TItem>;
  // IX???
  index: number;
};

type ReadWritable<TItem> = {
  type: "readWritable";
  // RW??? read write???
  items: Array<TItem>;
  /// WIX???
  writeIndex: number;
  /// RIX???
  readIndex: number;
};

type RingState<TItem> = Writable<TItem> | ReadWritable<TItem>;

// There is a bug in the ring buffer so we just use a queue as it seems to have the same behavior
export class RingBuffer<TItem> {
  #currentState: RingState<TItem>;
  constructor(size: number) {
    const initialState: Writable<TItem> = {
      type: "writable",
      items: Array(Math.max(size, 10)),
      index: 0,
    };

    this.#currentState = initialState;
  }

  #doubleSize(index: number, items: Array<TItem>): Array<TItem> {
    // I don't understand the source code. Like I know what it does but not why
    return [
      ...items,
      // Normally default value of TItem but
      ...items.map((_) => null as TItem),
    ];
  }

  pop(): TItem | undefined {
    switch (this.#currentState.type) {
      case "readWritable":
        const {
          items: items,
          readIndex: oldRix,
          writeIndex: wix,
        } = this.#currentState;
        const newRix = (oldRix + 1) % items.length;
        if (newRix === this.#currentState.writeIndex) {
          const newState: Writable<TItem> = {
            type: "writable",
            items: items,
            index: wix,
          };
          this.#currentState = newState;
        } else {
          const newState: ReadWritable<TItem> = {
            ...this.#currentState,
            readIndex: newRix,
          };
          this.#currentState = newState;
        }

        return items[oldRix];
      default:
        return undefined;
    }
  }

  push(item: TItem) {
    switch (this.#currentState.type) {
      // If state is writable we write the item to the current write index
      case "writable": {
        const { items, index } = this.#currentState;
        items[index] = item;
        const writeIndex = (index + 1) % items.length;
        const newState: ReadWritable<TItem> = {
          type: "readWritable",
          items,
          writeIndex,
          readIndex: index,
        };

        this.#currentState = newState;
        return;
      }
      case "readWritable": {
        const {
          items,
          writeIndex: writeIndex,
          readIndex: readIndex,
        } = this.#currentState;
        items[writeIndex] = item;
        const newWix = (writeIndex + 1) % items.length;
        if (newWix === readIndex) {
          const doubledItems = this.#doubleSize(readIndex, items);
          const newState: ReadWritable<TItem> = {
            type: "readWritable",
            items: doubledItems,
            writeIndex: items.length,
            readIndex: 0,
          };

          this.#currentState = newState;
          return;
        }
        // Else
        const newState: ReadWritable<TItem> = {
          type: "readWritable",
          items: items,
          writeIndex: newWix,
          readIndex: readIndex,
        };

        this.#currentState = newState;
        return;
      }
    }
  }
}
