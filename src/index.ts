import fn2 from "fn2"
import tinyId from "@fn2/tiny-id"

export class Logger {
  fn2: typeof fn2 = null
  tinyId: typeof tinyId = null

  ogPrepareArgs: typeof fn2.prepareArgs

  loaded(): void {
    const prepareArgs = this.fn2.prepareArgs.bind(this.fn2)
    this.ogPrepareArgs = this.fn2.prepareArgs

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

  reset(): void {
    this.fn2.prepareArgs = this.ogPrepareArgs
  }

  private addLoggers(
    steps: Record<string, any>[]
  ): Record<string, any>[] {
    const logMode =
      (typeof location !== "undefined" &&
        !!location.search.match(/[?&]log/)) ||
      (typeof process !== "undefined" && process.env.LOG)

    if (logMode) {
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

  private logStart({
    code,
    step,
    trace,
  }: {
    code: string
    step?: Record<string, any>
    trace: string[]
  }): void {
    const i = step ? "🐤" : "🥚"
    const s = this.stepInfo(step)
    const t = step ? trace[0] || "" : `${trace.join("\t(")}`
    // eslint-disable-next-line
    console.log(`${i} Starting ${code}\t${t}${s}`)
  }

  private logFinish({
    code,
    step,
    trace,
    time,
  }: {
    code: string
    step?: Record<string, any>
    trace: string[]
    time: number
  }): void {
    const i = step ? "🐔" : "🍗"
    const s = this.stepInfo(step)
    const t = trace[0] || ""
    const now = new Date().getTime()
    // eslint-disable-next-line
    console.log(`${i} Finished ${code}\t${t}${s}\t(${now - time} ms)`)
  }

  private stepInfo(step: Record<string, any>): string {
    return step
      ? Object.keys(step).length
        ? `\t{ ${Object.keys(step).join(", ")} }`
        : "\t{}"
      : ""
  }

  private stackTrace(): string[] {
    const err = new Error()

    try {
      let stack = err.stack
        .match(/^\s+at\s.+$/gm)[4]
        .replace(/^\s+at\s+/, "")

      if (typeof process !== "undefined" && process.cwd) {
        stack = stack.replace(process.cwd() + "/", "")
      }

      return stack.split(" (")
    } catch (e) {
      return []
    }
  }
}

export default new Logger()
