var prefs = require("sdk/preferences/service");
var self = require("sdk/self");
var sp = require("sdk/simple-prefs");
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var urls = require("sdk/url");

var button = ui.ToggleButton({
    id: "toolbar-button",
    label: "Open MyPass Panel",
    icon: {
        "16": "./img/logo-16.png",
        "32": "./img/logo-32.png",
        "64": "./img/logo-64.png"
    },
    onChange: button_onChange
});

var panel = require("sdk/panel").Panel({
    contentURL: "./panel.html",
    contentScriptFile: [
        "./js/jquery-2.2.3.min.js",
        "./js/bootstrap.min.js",
        "./js/cryptojs/components/core-min.js",
        "./js/cryptojs/components/enc-base64-min.js",
        "./js/cryptojs/rollups/hmac-sha512.js",
        "./pwdgen.js",
        "./panel.js",
    ],
    width: 340,
    height: 560,
    onShow: panel_onShow,
    onHide: panel_onHide
});

function button_onChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

function panel_onShow() {
    panel.port.emit("init", {
        site: parseTopDomain(tabs.activeTab.url),
        settings: ss.storage,
    });
}

function panel_onHide() {
    button.state("window", { state: false });
}

function settings_onReady(tab) {
    var worker = tab.attach({
        contentScriptFile: [
            "./settings.js",
        ],
    });
    worker.port.emit("init", ss.storage);
    worker.port.on("save-settings", saveSettings);
}

panel.port.on("open-settings", function() {
    panel.hide();
    tabs.open({
        url: "./settings.html",
        onReady: settings_onReady,
    });
});

panel.port.on("save-settings", saveSettings);

prefs.set("services.sync.prefs.sync.extensions." + self.id + ".settings", true);
sp.on("settings", function (prefname) {
    ss.storage = JSON.parse(sp.prefs["settings"]);
});
if (!Number.isInteger(ss.storage.defaultNumSymbol)) {
    ss.storage.defaultNumSymbol = 3;
}
if (!Number.isInteger(ss.storage.defaultLength)) {
    ss.storage.defaultLength = 16;
}
if (!Number.isInteger(ss.storage.defaultHashes)) {
    ss.storage.defaultHashes = 8;
}

function parseTopDomain(url) {
    var domain = urls.URL(url).host;
    if (domain === null) {
        return "";
    }
    var tld = urls.getTLD(url);
    var subDomainPart = domain.substring(0, domain.length - tld.length - 1);
    var lastDotIdx = subDomainPart.lastIndexOf(".");
    return subDomainPart.substring(lastDotIdx + 1) + "." + tld;
}

function saveSettings(settings) {
    ss.storage = settings;
    sp.prefs["settings"] = JSON.stringify(ss.storage);
}
