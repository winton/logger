import load, { fn2 } from "@fn2/loaded"
import patch from "@fn2/patch"
import tinyId from "@fn2/tiny-id"

import expect from "./expect"
import logger from "../src"

load({ logger, patch, tinyId })

it("logs", () => {
  fn2.run({
    hi: () => {},
    world: () => {},
  })
})
