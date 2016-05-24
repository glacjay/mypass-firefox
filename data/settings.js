function emitToPage(evt, args) {
    var clonedArgs = cloneInto(args, document.defaultView);
    var event = new CustomEvent(evt, { bubbles: true, detail: clonedArgs });
    document.documentElement.dispatchEvent(event);
}

self.port.on("init", function (settings) {
    emitToPage("init", settings);
});

window.addEventListener("save-settings", function (event) {
    self.port.emit("save-settings", event.detail);
});
