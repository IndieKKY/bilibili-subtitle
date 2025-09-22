interface Context<T> {
  resolve: (value: T) => void
  reject: (reason?: any) => void
}

export interface SuccessResult<T> {
  finished: true
  data: T
}
export interface FailResult<T> {
  finished: false
}
export type Result<T> = SuccessResult<T> | FailResult<T>

/**
 * 等待器
 */
export default class Waiter<T> {
  waitingList: Array<Context<T>> = []

  check: () => Result<T>

  finished = false
  success = false
  data?: T

  constructor(check: () => Result<T>, checkInterval: number, timeout: number) {
    this.check = check

    // timer
    const start = Date.now()
    const timerId = setInterval(() => {
      if (!this.tick()) {
        // check timeout
        if (Date.now() - start > timeout) {
          this.finished = true
          this.success = false
          this.data = undefined
          // reject all
          this.waitingList.forEach(e => e.reject('timeout'))
          this.waitingList = []
          // clear interval
          clearInterval(timerId)
        }
      } else {
        // clear interval
        clearInterval(timerId)
      }
    }, checkInterval)
  }

  private tick() {
    if (this.finished) {
      return true
    }
    const result = this.check()
    if (result.finished) {
      this.finished = true
      this.success = true
      this.data = result.data
      // execute waiting list first
      if (this.waitingList.length > 0) {
        this.waitingList.forEach(e => e.resolve(this.data as T))
        this.waitingList = []
      }
    }
    return result.finished
  }

  public async wait() {
    if (this.tick()) {
      return await Promise.resolve(this.data as T)
    } else {
      // add to waiting list
      return await new Promise<T>((resolve, reject) => {
        const context: Context<T> = {
          resolve,
          reject,
        }
        this.waitingList.push(context)
      })
    }
  }
}
