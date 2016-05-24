var pwdgen = PasswordGenerator.create();
var settings = {};

self.port.on("init", function(data) {
    settings = data.settings;
    $("#salt").val(settings.salt);
    $("#site").val(data.site);
    if ("sites" in settings && data.site in settings.sites) {
        var siteSetting = settings.sites[data.site];
        $("#username").val(siteSetting.username);
        $("#num_symbol").val(siteSetting.numSymbol);
        $("#length").val(siteSetting.length);
        $("#generation").val(siteSetting.generation);
        $("#hashes").val(siteSetting.hashes);
    } else {
        $("#username").val("");
        $("#num_symbol").val(settings.defaultNumSymbol);
        $("#length").val(settings.defaultLength);
        $("#generation").val(1);
        $("#hashes").val(settings.defaultHashes);
    }
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
        generation: Number($('#generation').val()),
        itercnt: 1 << Number($('#hashes').val()),
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
    setting.generation = $("#generation").val();
    setting.hashes = $("#hashes").val();
    self.port.emit("save-settings", settings).val();
});
