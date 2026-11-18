/* Applies the saved colour theme before the first paint, so dark mode never flashes white. */
(function () {
  try {
    var t = localStorage.getItem("mx:theme");
    /* the app stores the value JSON-encoded ("\"dark\""); accept a bare string too */
    try {
      t = JSON.parse(t);
    } catch (e) {}
    var dark = t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {
    /* storage blocked: follow the system setting via CSS */
  }
})();
