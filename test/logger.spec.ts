import loaded, { Fn2 } from "@fn2/loaded"
import patch from "@fn2/patch"
import tinyId from "@fn2/tiny-id"

import logger from "../src"

const { fn2 } = loaded.load({
  logger,
  patch,
  tinyId,
}) as { fn2: Fn2 }

it("logs", () => {
  fn2.run({
    hi: () => {},
    world: () => {},
  })
})
