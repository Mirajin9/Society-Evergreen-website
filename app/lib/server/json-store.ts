import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// A small JSON file store: every change is serialised and written atomically (temp file + rename),
// so concurrent requests can't overwrite each other and a crash never leaves a half-written file.
export function createJsonStore<T>(filePath: () => string, initial: () => T) {
  let queue: Promise<unknown> = Promise.resolve();

  function exclusive<R>(task: () => Promise<R>): Promise<R> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function load(): Promise<T> {
    let raw: string;
    try {
      raw = await readFile(filePath(), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return initial();
      throw error;
    }
    // A damaged file must fail loudly rather than be silently replaced with an empty one.
    return JSON.parse(raw) as T;
  }

  async function save(data: T) {
    const file = filePath();
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(tmp, file);
  }

  return {
    read: () => exclusive(load),
    update: <R>(mutate: (data: T) => R | Promise<R>) =>
      exclusive(async () => {
        const data = await load();
        const result = await mutate(data);
        await save(data);
        return result;
      })
  };
}
