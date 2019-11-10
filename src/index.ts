import { fn2 } from "@fn2/loaded"
import patch from "@fn2/patch"
import tinyId from "@fn2/tiny-id"

export class Logger {
  fn2: typeof fn2 = null
  patch: typeof patch = null
  tinyId: typeof tinyId = null

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
    code,
    step,
    trace,
  }: {
    code: string
    step?: Record<string, any>
    trace: string
  }): void {
    const s = step
      ? ` {${Object.keys(step).join(", ")}}`
      : ""
    const t = step ? "" : ` ${trace}`
    // eslint-disable-next-line
  console.log(`🐤 Starting ${code}${s}${t}`)
  }

  logFinish({
    code,
    step,
    trace,
    time,
  }: {
    code: string
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
    console.log(`🦆 Finished ${code}${s}${t} in ${now - time} ms`)
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
      const code = this.tinyId.generate()
      const time = new Date().getTime()
      const trace = this.stackTrace()

      const newSteps = steps.reduce((memo, step, i) => {
        return memo.concat([
          {
            args: [{ code: `${code}${i}`, step, trace }],
            logStart: this.logStart,
          },
          step,
          {
            args: [
              { code: `${code}${i}`, step, trace, time },
            ],
            logFinish: this.logFinish,
          },
        ])
      }, [])

      newSteps.unshift({
        args: [{ code, trace }],
        logStart: this.logStart,
      })

      newSteps.push({
        args: [{ code, trace, time }],
        logFinish: this.logFinish,
      })

      return newSteps
    }

    return steps
  }
}

export default new Logger()
