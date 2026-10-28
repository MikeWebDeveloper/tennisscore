// The first controller is installation, not an update. Reload only when a
// page that already had a controller receives a replacement worker.
export function createControllerChangeHandler(initiallyControlled: boolean, reload: () => void) {
  let controlled = initiallyControlled
  return () => {
    if (controlled) reload()
    else controlled = true
  }
}
