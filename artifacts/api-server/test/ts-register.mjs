/** Registers the .js -> .ts resolve hook for the test run. */
import { register } from "node:module";
register("./ts-resolve-hook.mjs", import.meta.url);
