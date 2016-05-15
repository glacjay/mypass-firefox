var KeyModes = {
    kWebPwd: 0x01,
    kLoginPwd: 0x02,
    kRecordAes: 0x03,
    kRecordHmac: 0x04,
};

var config = {
    options_key: "##mypass_options##",
    salt_key: "##salt##",
    options: {
        default_: {
            nsym: 0,
            len: 16,
            gen: 1,
            hashes: 8,
        },
    },
    pw: {
        min_size: 8,
        max_size: 20,
    },
};

var PasswordGenerator = {
    create: function() {
        var pwdgen = {};

        pwdgen.generate = function(input) {
            var dk = this.derive_web_pw_key(input.salt, input.passphrase, input.itercnt);
            var i = 0;
            var ret = null;
            while (true) {
                var a = [
                    "OneShallPass v2.0",
                    input.salt,
                    input.site,
                    input.generation,
                    i
                ];
                var wa = pack_to_word_array(a);
                var hash = CryptoJS.HmacSHA512(wa, dk);
                var b64 = hash.toString(CryptoJS.enc.Base64);
                if (this.is_ok_pw(b64)) {
                    ret = b64;
                    break;
                }
                ++i;
            }
            var x = this.add_syms(ret, input.num_symbol);
            return x.substring(0, input.length);
        };

        pwdgen.derive_web_pw_key = function(salt, passphrase, itercnt) {
            return this.run_key_derivation(salt, passphrase, itercnt, KeyModes.kWebPwd);
        };

        pwdgen.run_key_derivation = function(salt, passphrase, itercnt, keymode) {
            var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA512, passphrase);
            var block_index = CryptoJS.lib.WordArray.create([keymode]);
            var block = hmac.update(salt).finalize(block_index);
            hmac.reset();

            var intermediate = block.clone();
            for (var i = 1; i < itercnt; ++i) {
                intermediate = hmac.finalize(intermediate);
                hmac.reset();
                for (var j = 0; j < intermediate.words.length; ++j) {
                    block.words[j] ^= intermediate.words[j];
                }
            }

            return block;
        };

        pwdgen.is_ok_pw = function (pwd) {
            var uppers = 0;
            var lowers = 0;
            var digits = 0;

            for (var i = 0; i < config.pw.min_size; ++i) {
                var ch = pwd.charCodeAt(i);
                if (this.is_upper(ch)) {
                    ++uppers;
                } else if (this.is_lower(ch)) {
                    ++lowers;
                } else if (this.is_digit(ch)) {
                    ++digits;
                } else {
                    return false;
                }
            }

            var bad = function(n) {
                return (n === 0) || (n > 5);
            };
            if (bad(uppers) || bad(lowers) || bad(digits)) {
                return false;
            }

            for (var i = config.pw.min_size; i < config.pw.max_size; ++i) {
                if (!this.is_valid(pwd.charCodeAt(i))) {
                    return false;
                }
            }

            return true;
        };

        pwdgen.add_syms = function(input, n) {
            if (n <= 0) {
                return input;
            }
            var fn = this.find_class_to_sub(input);
            var indices = [];
            for (var i = 0; i < config.pw.min_size; ++i) {
                var ch = input.charCodeAt(i);
                if (fn(ch)) {
                    indices.push(i);
                    --n;
                    if (n === 0) {
                        break;
                    }
                }
            }
            return this.add_syms_at_indices(input, indices);
        };

        pwdgen.add_syms_at_indices = function(input, indices) {
            var _map = "`~!@#$%^&*()-_+={}[]|;:,<>.?/";
            return this.translate_at_indices(input, indices, _map);
        };

        pwdgen.translate_at_indices = function(input, indices, _map) {
            var last = 0;
            var arr = [];
            for (var i = 0; i < indices.length; ++i) {
                var idx = indices[i];
                arr.push(input.substring(last, idx));
                var ch = input.charAt(idx);
                var map_idx = CryptoJS.enc.Base64._map.indexOf(ch);
                ch = _map.charAt(map_idx % _map.length);
                arr.push(ch);
                last = idx + 1;
            }
            arr.push(input.substring(last));
            return arr.join("");
        };

        pwdgen.find_class_to_sub = function(pwd) {
            var uppers = 0;
            var lowers = 0;
            var digits = 0;

            for (var i = 0; i < config.pw.min_size; ++i) {
                var ch = pwd.charCodeAt(i);
                if (this.is_upper(ch)) {
                    ++uppers;
                } else if (this.is_lower(ch)) {
                    ++lowers;
                } else if (this.is_digit(ch)) {
                    ++digits;
                }
            }

            if (uppers >= lowers && uppers >= digits) {
                return this.is_upper;
            } else if (lowers >= uppers && lowers >= digits) {
                return this.is_lower;
            } else {
                return this.is_digit;
            }
        };

        pwdgen.is_upper = function(ch) {
            return "A".charCodeAt(0) <= ch && ch <= "Z".charCodeAt(0);
        };

        pwdgen.is_lower = function(ch) {
            return "a".charCodeAt(0) <= ch && ch <= "z".charCodeAt(0);
        };

        pwdgen.is_digit = function(ch) {
            return "0".charCodeAt(0) <= ch && ch <= "9".charCodeAt(0);
        };

        pwdgen.is_valid = function(ch) {
            return this.is_upper(ch) || this.is_lower(ch) || this.is_digit(ch);
        };

        return pwdgen;
    }
};

function pack_to_word_array(obj) {
    var ui8a = [0x95];
    ui8a = ui8a.concat(pack_str(obj[0]));
    ui8a = ui8a.concat(pack_str(obj[1]));
    ui8a = ui8a.concat(pack_str(obj[2]));
    ui8a = ui8a.concat(pack_int(obj[3]));
    ui8a = ui8a.concat(pack_int(obj[4]));
    ui8a = new Uint8Array(ui8a);
    var i32a = ui8a_to_i32a(ui8a);
    return CryptoJS.lib.WordArray.create(i32a, ui8a.length);
}

function pack_str(str) {
    var len = str.length;
    var prefix = [];
    if (len < Math.pow(2, 5)) {
        prefix.push(0xA0 + len);
    } else if (len < Math.pow(2, 8)) {
        prefix.push(0xD9);
        prefix.push(len);
    } else if (len < Math.pow(2, 16)) {
        prefix.push(0xDA);
        prefix.push(len >> 8);
        prefix.push(len & 0xFF);
    } else if (len < Math.pow(2, 32)) {
        prefix.push(0xDB);
        prefix.push((len >> 24) & 0xFF);
        prefix.push((len >> 16) & 0xFF);
        prefix.push((len >> 8) & 0xFF);
        prefix.push((len >> 0) & 0xFF);
    }
    for (var i = 0; i < len; ++i) {
        prefix.push(str.charCodeAt(i));
    }
    return prefix;
}

function pack_int(num) {
    var str = [];
    if (num < 0) {
        return [];
    } else if (num < Math.pow(2, 7)) {
        str.push(num);
    } else {
        for (var i = 0; i < 4; ++i) {
            var bytes = Math.pow(2, i);
            if (num < Math.pow(2, bytes * 8)) {
                str.push(0xCC + i);
                for (var j = 0; j < bytes; ++j) {
                    str.push((num >> ((bytes - j - 1) * 8)) & 0xFF);
                }
                break;
            }
        }
    }
    return str;
}

function ui8a_to_i32a(ui8a) {
    var n = ui8a.length;
    var nw = (n >>> 2) + ((n & 0x03) ? 1 : 0);
    var result = new Int32Array(nw);
    for (var i = 0; i < nw; ++i) {
        result[i] = 0;
    }
    for (var i = 0; i < n; ++i) {
        result[i >>> 2] |= (ui8a[i] << ((3 - (i & 0x03)) << 3));
    }
    return result;
}
