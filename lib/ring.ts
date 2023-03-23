type Writable<TItem> = {
  type: "writable";
  // WX??? write exclusive????
  wx: Array<TItem>;
  // IX???
  ix: number;
};

type ReadWritable<TItem> = {
  type: "readWritable";
  // RW??? read write???
  rw: Array<TItem>;
  /// WIX???
  wix: number;
  /// RIX???
  rix: number;
};

type RingState<TItem> = Writable<TItem> | ReadWritable<TItem>;

export class RingBuffer<TItem> {
  #state: RingState<TItem>;
  constructor(size: number) {
    const initialState: Writable<TItem> = {
      type: "writable",
      wx: Array(Math.max(size, 10)),
      ix: 0,
    };

    this.#state = initialState;
  }

  #doubleSize(ix: number, items: Array<TItem>): Array<TItem> {
    // I don't understand the source code. Like I know what it does but not why
    return [
      ...items.slice(0, ix),
      ...items.slice(ix),
      // Normally default value of TItem but
      ...items.map((_) => null as TItem),
    ];
  }

  pop(): TItem | undefined {
    switch (this.#state.type) {
      case "readWritable":
        const { rw: items, rix: oldRix, wix } = this.#state;
        const newRix = (oldRix + 1) % items.length;
        if (newRix === this.#state.wix) {
          const newState: Writable<TItem> = {
            type: "writable",
            wx: items,
            ix: wix,
          };
          this.#state = newState;
        } else {
          const newState: ReadWritable<TItem> = {
            ...this.#state,
            rix: newRix,
          };
          this.#state = newState;
        }

        return items[oldRix];
      default:
        return undefined;
    }
  }

  push(item: TItem) {
    switch (this.#state.type) {
      case "writable": {
        const { wx: items, ix } = this.#state;
        items[ix] = item;
        const wix = (ix + 1) % items.length;
        const newState: ReadWritable<TItem> = {
          type: "readWritable",
          rw: items,
          wix,
          rix: ix,
        };

        this.#state = newState;
        return;
      }
      case "readWritable": {
        const { rw: items, wix, rix } = this.#state;
        items[wix] = item;
        const newWix = (wix + 1) % items.length;
        if (newWix === rix) {
          const newState: ReadWritable<TItem> = {
            type: "readWritable",
            rw: this.#doubleSize(rix, items),
            wix: items.length,
            rix: 0,
          };

          this.#state = newState;
          return;
        }
        // Else
        const newState: ReadWritable<TItem> = {
          type: "readWritable",
          rw: items,
          wix: newWix,
          rix,
        };

        this.#state = newState;
        return;
      }
    }
  }
}
