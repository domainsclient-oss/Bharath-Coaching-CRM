/**
 * Radix modal layers (AlertDialog, DropdownMenu, Dialog, Sheet) lock the
 * document while open — `pointer-events: none` on <body>, plus scroll-lock
 * styles from react-remove-scroll — and undo it during their close cleanup.
 *
 * Navigating away in the same tick as the close (as logout does: it pushes to
 * /login from inside the confirm dialog) unmounts the layer before that cleanup
 * runs, so the lock leaks onto the next page and makes it completely inert —
 * visible, but unclickable and unfocusable until a hard refresh.
 *
 * Call this once the previous page's layers are definitively gone. Any lock
 * still present at that point is stale by definition, so clearing it is safe.
 */
export function releaseUiLock() {
  if (typeof document === 'undefined') return;

  const { body } = document;
  body.style.removeProperty('pointer-events');
  body.style.removeProperty('overflow');
  body.removeAttribute('data-scroll-locked');
}
