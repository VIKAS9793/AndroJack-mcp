import { pathToFileURL } from "node:url";

export function isDirectExecution(moduleUrl: string): boolean {
  const entryPoint = process.argv[1];
  return typeof entryPoint === "string" && moduleUrl === pathToFileURL(entryPoint).href;
}
