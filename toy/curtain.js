/**
 * Hangs the table's backdrop behind the loading curtain's mist, so the trees
 * and houses are already there while the table itself is still being built,
 * and sets the curtain's sketch going with the load. It runs before main.js,
 * which waits on the page's scripts and three.js.
 */
import { backdropCanvas } from "./backdrop.js";
import { paceSketch } from "./loading.js";

const view = document.getElementById("view");
if (view) {
  const picture = backdropCanvas();
  picture.className = "curtain-backdrop";
  view.prepend(picture);
  requestAnimationFrame(() => view.classList.add("is-painted"));
}
paceSketch();
