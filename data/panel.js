var pwdgen = PasswordGenerator.create();

self.port.on("init", function(data) {
    $("#site").val(data.site);
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
