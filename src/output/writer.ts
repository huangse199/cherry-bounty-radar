import { writeFile } from "node:fs/promises"

export function renderJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export async function writeOrPrint(output: string, outputPath?: string) {
  if (!outputPath) {
    console.log(output)
    return
  }

  await writeFile(outputPath, output, "utf8")
}
