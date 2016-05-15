var self = require("sdk/self");
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
        "./js/jquery.min.js",
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
    });
}

function panel_onHide() {
    button.state("window", { state: false });
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
