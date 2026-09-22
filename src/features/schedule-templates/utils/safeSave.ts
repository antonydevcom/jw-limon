export type SaveResult = { error: string | null }

const SAVE_FAILED_MESSAGE = "No se pudieron guardar los cambios. Inténtalo de nuevo."

/** Server actions can throw on network failure; turn that into a normal result. */
export async function safeSave(save: () => Promise<SaveResult>): Promise<SaveResult> {
  try {
    return await save()
  } catch {
    return { error: SAVE_FAILED_MESSAGE }
  }
}
