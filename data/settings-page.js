window.addEventListener("init", function (event) {
    window.settings = event.detail;

    $("#salt").val(settings.salt);
    $("#num_symbol").val(settings.defaultNumSymbol);
    $("#length").val(settings.defaultLength);
    $("#hashes").val(settings.defaultHashes);

    for (var site in settings.sites) {
        var setting = settings.sites[site];
        var tr = $("<tr>", { id: site });
        $("#site-opt").append(tr);
        tr.append($("<td>").text(site));
        tr.append($("<td>").text(setting.username));
        tr.append($("<td>").text(setting.numSymbol));
        tr.append($("<td>").text(setting.length));
        tr.append($("<td>").text(setting.generation));
        tr.append($("<td>").text(setting.hashes));
        var td = $("<td>");
        td.append($("<button>", { "class": "btn btn-mini", value: site }).text("del"));
        tr.append(td);
    }

    $("#save").on("click", function () {
        settings.salt = $("#salt").val();
        settings.defaultNumSymbol = $("#num_symbol").val();
        settings.defaultLength = $("#length").val();
        settings.defaultHashes = $("#hashes").val();
        saveSettings();
    });

    $("#site-opt button").on("click", function () {
        var site = this.value;
        var btn = $("#site-opt button[value='" + site + "']");
        if (btn.html() === "del") {
            btn.html("ok?");
            return;
        }
        delete settings.sites[site];
        saveSettings();
        $("#site-opt tr[id='" + site + "']").remove()
    });
});

function saveSettings() {
    emitToContent("save-settings", settings);
}

function emitToContent(evt, args) {
    var event = document.createEvent("CustomEvent");
    event.initCustomEvent(evt, true, true, args);
    document.documentElement.dispatchEvent(event);
}
