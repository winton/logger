import { fn2 } from "@fn2/loaded"
import patch from "@fn2/patch"

export class Logger {
  fn2: typeof fn2 = null
  patch: typeof patch = null

  counter = 0

  loaded(): void {
    const prepareArgs = this.fn2.prepareArgs.bind(this.fn2)

    this.fn2.prepareArgs = (
      m: Record<string, any>,
      a: any[],
      s: Record<string, any>[]
    ): [
      Record<string, any>,
      any[],
      Record<string, any>[]
    ] => {
      const [memo, args, steps] = prepareArgs(m, a, s)
      const steps2 = this.addLoggers(steps)
      return [memo, args, steps2]
    }
  }

  logStart({
    count,
    step,
    trace,
  }: {
    count: number
    step?: Record<string, any>
    trace: string
  }): void {
    const s = step
      ? ` {${Object.keys(step).join(", ")}}`
      : ""
    const t = step ? "" : ` ${trace}`
    // eslint-disable-next-line
  console.log(`🐤 Starting ${count}${s}${t}`)
  }

  logFinish({
    count,
    step,
    trace,
    time,
  }: {
    count: number
    step?: Record<string, any>
    trace: string
    time: number
  }): void {
    const s = step
      ? ` {${Object.keys(step).join(", ")}}`
      : ""
    const t = step ? "" : ` ${trace}`
    const now = new Date().getTime()
    // eslint-disable-next-line
    console.log(`🦆 Finished ${count}${s}${t} in ${now - time} ms`)
  }

  stackTrace(): string {
    const err = new Error()
    const stack = err.stack
      .match(/^\s+at\s.+$/gm)[4]
      .replace(/^\s+/, "")

    if (typeof process !== "undefined") {
      return stack.replace(process.cwd() + "/", "")
    }

    return stack
  }

  addLoggers(
    steps: Record<string, any>[]
  ): Record<string, any>[] {
    if (typeof process !== "undefined" && process.env.LOG) {
      const count = (this.counter += 1)
      const time = new Date().getTime()

      const trace = this.stackTrace()

      const newSteps = steps.reduce((memo, step) => {
        return memo.concat([
          {
            args: [{ count, step, trace }],
            logStart: this.logStart,
          },
          step,
          {
            args: [{ count, step, trace, time }],
            logFinish: this.logFinish,
          },
        ])
      }, [])

      newSteps.unshift({
        args: [{ count, trace }],
        logStart: this.logStart,
      })

      newSteps.push({
        args: [{ count, trace, time }],
        logFinish: this.logFinish,
      })

      return newSteps
    }

    return steps
  }
}

export default new Logger()
