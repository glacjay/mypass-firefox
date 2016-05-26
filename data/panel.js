var pwdgen = PasswordGenerator.create();
var settings = {};
var curSite = null;

self.port.on("init", function(data) {
    settings = data.settings;
    curSite = data.site;
    $("#salt").val(settings.salt);
    $("#site").val(curSite);
    loadSiteSettings(curSite);
});

self.port.on("clear-passphrase", function () {
    $("#passphrase").val("");
    $("#passwd").val("");
});

$("#settings").on("click", function () {
    self.port.emit("open-settings");
});

$("#generate").on("click", function() {
    var site = $("#site").val();
    if (site === "") {
        return;
    }
    var pwd = pwdgen.generate({
        salt: $('#salt').val(),
        site: site,
        passphrase: $('#passphrase').val(),
        num_symbol: Number($('#num_symbol').val()),
        length: Number($('#length').val()),
        itercnt: 1 << Number($('#hashes').val()),
        generation: Number($('#generation').val()),
    });
    $("#passwd").val(pwd);
});

$("#save").on("click", function () {
    var site = $("#site").val();
    if (site === "") {
        return;
    }
    if (!("sites" in settings)) {
        settings.sites = {};
    }
    if (!(site in settings.sites)) {
        settings.sites[site] = {};
    }
    var setting = settings.sites[site];
    setting.username = $("#username").val();
    setting.numSymbol = $("#num_symbol").val();
    setting.length = $("#length").val();
    setting.hashes = $("#hashes").val();
    setting.generation = $("#generation").val();
    self.port.emit("save-settings", settings);
    markAllAsSaved(true);
});

$("#load").on("click", function () {
    loadSiteSettings($("#site").val());
});

$("#site").on("input", function () {
    var site = $("#site").val();
    markAsSaved($(this), site === curSite);
});

$("#site").on("keypress", function (key) {
    if (key.which === 13) {
        loadSiteSettings($(this).val());
    }
});

$("#username").on("input", function () {
    var site = $("#site").val();
    markAsSaved($(this), isSiteInSettings(site) && settings.sites[site].username === $(this).val());
});

$("#num_symbol").on("change", function () {
    var site = $("#site").val();
    markAsSaved($(this), isSiteInSettings(site) && settings.sites[site].numSymbol === $(this).val());
});

$("#length").on("change", function () {
    var site = $("#site").val();
    markAsSaved($(this), isSiteInSettings(site) && settings.sites[site].length === $(this).val());
});

$("#hashes").on("change", function () {
    var site = $("#site").val();
    markAsSaved($(this), isSiteInSettings(site) && settings.sites[site].hashes === $(this).val());
});

$("#generation").on("change", function () {
    var site = $("#site").val();
    markAsSaved($(this), isSiteInSettings(site) && settings.sites[site].generation === $(this).val());
});

function loadSiteSettings(site) {
    if (isSiteInSettings(site)) {
        var setting = settings.sites[site];
        $("#username").val(setting.username);
        $("#num_symbol").val(setting.numSymbol);
        $("#length").val(setting.length);
        $("#hashes").val(setting.hashes);
        $("#generation").val(setting.generation);
        markAllAsSaved(true);
    } else {
        $("#username").val("");
        $("#num_symbol").val(settings.defaultNumSymbol);
        $("#length").val(settings.defaultLength);
        $("#hashes").val(settings.defaultHashes);
        $("#generation").val(1);
        if (site !== "") {
            markAllAsSaved(false);
        }
    }

    markAsSaved($("#site"), true);
    curSite = site;
}

function markAllAsSaved(saved) {
    markAsSaved($("#username"), saved);
    markAsSaved($("#num_symbol"), saved);
    markAsSaved($("#length"), saved);
    markAsSaved($("#hashes"), saved);
    markAsSaved($("#generation"), saved);
}

function markAsSaved(elem, saved) {
    if (!saved) {
        elem.css("border", "2px solid lightsalmon");
    } else {
        elem.css("border", "1px solid #CCCCCC");
    }
}

function isSiteInSettings(site) {
    return "sites" in settings && site in settings.sites;
}
