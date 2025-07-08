export class ESFunction {
  static sleep = async (time: number) => {
    return await new Promise((resolve) =>
      setTimeout(() => {
        resolve(time)
      }, time),
    )
  }

  static runTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${timeout}ms`)), timeout),
    )
    return Promise.race([promise, timeoutPromise])
  }

  static debounceAsync = <T>(func: (...args: any[]) => Promise<T>, delay: number) => {
    let state = 0

    return async (...args: any[]): Promise<T | null> => {
      state++
      const current = state
      await ESFunction.sleep(delay)
      if (current !== state) return null // Hiểu đơn giản là sau khi ngủ dậy thì thấy thằng khác cướp mất state rồi
      return await func(...args)
    }
  }
}

// ESFunction.runTimeout(ESFunction.sleep(2000), 1000)
//   .then((result) => {
//     console.log('[SUCCESS]', result)
//   })
//   .catch((error) => {
//     console.log('[ERROR]:', error.message)
//   })

export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null

  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, delay)
  }
}

export const throttle = (func: (...args: any[]) => void, delay: number) => {
  let lastCall = 0

  return function (...args: any[]) {
    const now = new Date().getTime()

    if (now - lastCall >= delay) {
      lastCall = now
      return func(...args)
    }
  }
}

export const debounceAsync = (func: (...args: any[]) => Promise<any>, delay: number) => {
  let state = 0

  return async (...args: any[]): Promise<any> => {
    state++
    const current = state
    await ESFunction.sleep(delay)
    if (current !== state) return null // Hiểu đơn giản là sau khi ngủ dậy thì thấy thằng khác cướp mất state rồi
    return await func(...args)
  }
}

export const throttleAsync = (func: (...args: any[]) => Promise<any>, delay: number) => {
  let state = 0

  return async (...args: any[]): Promise<any> => {
    if (state !== 0) return null // Hiểu đơn giản là state đang bị thằng khác xử lý rồi
    state++
    const result = await func(...args)
    ESFunction.sleep(delay)
      .then((e) => (state = 0))
      .catch((e) => (state = 0)) // Xử lý xong mới nhả state ra
    return result
  }
}

export const fetchOne = <T>(func: () => Promise<T>) => {
  let promise: Promise<T> | null = null

  return async (options?: { refresh: boolean }): Promise<T> => {
    if (!promise || options?.refresh) {
      promise = func()
    }
    return await promise
  }
}

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => CancellablePromise<T>
  isCancelled: () => boolean
  isResolved: () => boolean
  isRejected: () => boolean
}

export const PromiseCancellable = <T>(task: Promise<T>): CancellablePromise<T> => {
  const _symbol = Symbol('CANCEL')
  let _reject: (reason?: any) => void

  let isCancelled = false
  let isResolved = false
  let isRejected = false

  const promiseCancel = new Promise((resolve, reject) => {
    _reject = reject
  })
  const race = Promise.race([task, promiseCancel]) as CancellablePromise<T>

  race
    .then(() => (isResolved = true))
    .catch((reason) => {
      if (reason === _symbol) isCancelled = true
      else isRejected = true
    })
  race.cancel = () => {
    _reject(_symbol)
    return race
  }
  race.isCancelled = () => isCancelled
  race.isResolved = () => isResolved
  race.isRejected = () => isRejected
  return race
}

// const longTask = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     reject('Task complete')
//   }, 3000)
// })

// const taskCancellable = PromiseCancellable(longTask)
// setTimeout(() => {
//   taskCancellable.cancel()
// }, 1000)

// taskCancellable
//   .then((result) => console.log('PromiseCancellable Success: ', result))
//   .catch((error) => {
//     if (taskCancellable.isCancelled()) {
//       console.log('PromiseCancellable was cancel', error)
//     } else {
//       console.log('PromiseCancellable failed for another reason', error)
//     }
//   })

export const FetchUrlTimeout = <T>(url: string, timeout: number): Promise<T> => {
  const fetchPromise = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return response.json() as Promise<T>
  })

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout!')), timeout),
  )

  return Promise.race([fetchPromise, timeoutPromise])
}

// Sử dụng hàm FetchUrlTimeout
// FetchUrlTimeout<{ id: number; title: string }>('https://jsonplaceholder.typicode.com/todos/1', 1000)
//   .then((data) => console.log('Data:', data))
//   .catch((error) => console.error('Error:', error))
