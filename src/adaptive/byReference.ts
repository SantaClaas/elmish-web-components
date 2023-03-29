// Just a mock for ref<T> for completeness and not deviate from original source but probably not necessary
// Since this is of type object it will be passed by reference in JS and the value can be a value type but we access it through this object so it will behave like a reference type if accessed through this objectdi
export type ByReference<T> = { value: T };
