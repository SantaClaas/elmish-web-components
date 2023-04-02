import { AdaptiveObject } from "../core/adaptiveObject";
import { AdaptiveToken } from "../core/adaptiveToken";
import { IAdaptiveObject } from "../core/core";

interface IAdaptiveValue extends IAdaptiveObject {
  getValueUntyped(token: AdaptiveToken): object;
  // Don't have type information in JS
  // contentType: Type
  accept<R>(visitor: IAdaptiveValueVisitor<R>): R;
}

interface IAdaptiveValueOf<T> extends IAdaptiveValue {
  getValue(token: AdaptiveToken): T;
}

interface IAdaptiveValueVisitor<R> {
  visit<T>(value: IAdaptiveValueOf<T>): R;
}

// Sealed in source
export class ChangeableValue<TValue> extends AdaptiveObject {
  #value: TValue;
  constructor(value: TValue) {
    super();
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  set value(value: TValue) {
    if (value === this.#value) return;

    this.#value = value;
    super.mar;
  }
}

export function cval<TValue>(value: TValue): ChangeableValue<TValue> {
  return new ChangeableValue<TValue>();
}

export function map<TValue, TResult>(
  mapping: (value: TValue) => TResult,
  value: IAdaptiveValueOf<TValue>
) {
  if (value.isConstant) return ConstantValue.lazy(() => mapping(force(value)));

  return MapNonAdaptiveValue(mapping, value);
}
