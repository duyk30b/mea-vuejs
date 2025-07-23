export class ESTypescript {
  static keysEnum = <T extends Record<string, string | number>>(e: T): (keyof T)[] => {
    return Object.keys(e).filter((key) => isNaN(Number(key))) as (keyof T)[]
  }

  static valuesEnum = <T extends Record<string, string | number>>(e: T): T[keyof T][] => {
    return keysEnum(e).map((key) => e[key])
  }

  static objectEnum = <T extends Record<string, string | number>>(
    e: T,
  ): { [K in keyof T]: T[K] } => {
    return keysEnum(e).reduce(
      (acc, key) => {
        acc[key] = e[key]
        return acc
      },
      {} as { [K in keyof T]: T[K] },
    )
  }
}

export const OmitClass = <T, K extends keyof T>(
  Class: new () => T,
  keys: K[],
): new () => Omit<T, (typeof keys)[number]> => Class

export const PickClass = <T, K extends keyof T>(
  Class: new () => T,
  keys: K[],
): new () => Pick<T, (typeof keys)[number]> => Class

export const keysEnum = <T extends Record<string, string | number>>(e: T): (keyof T)[] => {
  return Object.keys(e).filter((key) => isNaN(Number(key))) as (keyof T)[]
}

export type Impossible<K extends keyof any> = {
  [P in K]: never
}

export type NoExtra<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>
// export type NoExtraProperties<T, U extends T = T> = U extends Array<infer V>
//   ? NoExtraProperties<V>[]
//   : U & Impossible<Exclude<keyof U, keyof T>>

// https://stackoverflow.com/questions/49580725/is-it-possible-to-restrict-typescript-object-to-contain-only-properties-defined

// interface Animal {
//   name: string;
//   noise: string;
// }

// function thisWorks<T extends Animal>(animal: T & Impossible<Exclude<keyof T, keyof Animal>>): void {
//   console.log(`The noise that ${animal.name.toLowerCase()}s make is ${animal.noise}.`);
// }

// function thisIsAsGoodAsICanGetIt<T extends Animal>(animal: NoExtraProperties<Animal, T>): void {
//   console.log(`The noise that ${animal.name.toLowerCase()}s make is ${animal.noise}.`);
// }

// // It works for variables defined as the type
// const okay: NoExtraProperties<Animal> = {
//   name: 'Dog',
//   noise: 'bark',
// };

// const wrong1: NoExtraProperties<Animal> = {
//   name: 'Cat',
//   noise: 'meow'
//   betterThanDogs: false, // look, an error!
// };

// // What happens if we try to bypass the "Excess Properties Check" done on object literals
// // by assigning it to a variable with no explicit type?
// const wrong2 = {
//   name: 'Rat',
//   noise: 'squeak',
//   idealScenarios: ['labs', 'storehouses'],
//   invalid: true,
// };

// thisWorks(okay);
// thisWorks(wrong1); // doesn't flag it as an error here, but does flag it above
// thisWorks(wrong2); // yay, an error!

// thisIsAsGoodAsICanGetIt(okay);
// thisIsAsGoodAsICanGetIt(wrong1); // no error, but error above, so okay
// thisIsAsGoodAsICanGetIt(wrong2); // yay, an error!
