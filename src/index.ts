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
    const s = this.stepInfo(step)
    const t = step ? "" : `${trace}`
    // eslint-disable-next-line
    console.log(`🐣 Starting ${code}\t${s}${t}`)
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
    const s = this.stepInfo(step)
    const t = step ? "" : `${trace}`
    const now = new Date().getTime()
    // eslint-disable-next-line
    console.log(`🍗 Finished ${code}\t${s}${t} - ${now - time} ms`)
  }

  stepInfo(step: Record<string, any>): string {
    return step
      ? Object.keys(step).length
        ? `{ ${Object.keys(step).join(", ")} }`
        : "{}"
      : ""
  }

  stackTrace(): string {
    const err = new Error()
    const stack = err.stack
      .match(/^\s+at\s.+$/gm)[4]
      .replace(/^\s+at\s/, "")
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
            logStart: this.logStart.bind(this),
          },
          step,
          {
            args: [
              { code: `${code}${i}`, step, trace, time },
            ],
            logFinish: this.logFinish.bind(this),
          },
        ])
      }, [])

      newSteps.unshift({
        args: [{ code, trace }],
        logStart: this.logStart.bind(this),
      })

      newSteps.push({
        args: [{ code, trace, time }],
        logFinish: this.logFinish.bind(this),
      })

      return newSteps
    }

    return steps
  }
}

export default new Logger()
