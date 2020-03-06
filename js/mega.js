// main
// example:
// version 1
// mega://enc?sjh3hoftyW8m5MmJDKW1c4TApgdMHLa2t7vtGQnag8VhGElc7r2JMrOdLqX0qpGR-MIqFh0jjxR0-NlAKxAuTQ
// mega://fenc?ahc5Kx7gP-41l8GlalamcPAq9GqCMIALVCUNgvmKLh8BOwFYBaxWRkN-vsHFmOwo
// version 2
// mega://enc2?VdFBBVBv_AUzfGCkXt_Qrw5pC0PjzWzj3trelIvZZ4fRNuVo5GVeyepiMWqNb08eQUOk1sBvU0UqXriiOnnaVw
// mega://fenc2?6Bn4WcYTWhHDGfi7WnrnTwOukwhWy6Q1UPtKeARrrkL1Dt5Kyrt0w2XaCPYy9Htf
var decryptURL = function(url) {
	var rootURL = "https://mega.nz/#";
	var isFolder = url.charAt(7) === "f" ? true : false;
	if (isFolder) {
		rootURL += "F"
	}
	var urlpatterns = {
		megadownloaderapp: {
			regexp: new RegExp("mega://f?enc?\\?([A-Za-z0-9-_,]+)", 'i'),
			process: megadownloaderappDecrypt
		},
		megadownloaderapp2: {
			regexp: new RegExp("mega://f?enc2?\\?([A-Za-z0-9-_,]+)", 'i'),
			process: megadownloaderappDecrypt2
		}
	};

	var pass = false
	for (pattern in urlpatterns) {
		var match = urlpatterns[pattern].regexp.exec(url);
		if (match != null) {
			pass = true
			str = urlpatterns[pattern].process(match[1]);
			if (str !== "") {
				return rootURL + str
			}
		}
	}
	if (!pass) {
		throw new Error("Invalid Mega Link")
	}
	throw new Error("Decrypt Failed")
};

var megadownloaderappDecrypt2 = function(str) {
	var password = [237, 31, 76, 32, 11, 53, 19, 152, 6, 178, 96, 86, 59, 61, 56, 118, 240, 17, 180, 117, 15, 58, 26, 74, 94, 253, 11, 190, 103, 85, 75, 68];
	var iv = CryptoJS.enc.Hex.parse("79F10A01844A0B27FF5B2D4E0ED3163E");

	// Recover Base64 from encoded string
	var b64str = str;
	b64str += "==".substring((2 - b64str.length * 3) & 3);
	b64str = b64str.replace(new RegExp("-", 'g'), "+").replace(new RegExp("_", 'g'), "/").replace(new RegExp(",", 'g'), "");

	// Decoding step
	var encryptedText = CryptoJS.enc.Base64.parse(b64str);

	var byteArrayToWordArray = function(byteArray) {
		var wordArray = [],
			i;
		for (i = 0; i < byteArray.length; i++) {
			wordArray[(i / 4) | 0] |= byteArray[i] << (24 - 8 * i);
		}
		return CryptoJS.lib.WordArray.create(wordArray, byteArray.length);
	}

	var key = byteArrayToWordArray(password)

	var aes = CryptoJS.algo.AES.createDecryptor(key, {
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
		iv: iv
	});
	var decrypted = aes.finalize(encryptedText);

	// Helper function to convert hex to ASCII
	var hex2ascii = function(hex) {
		var str = '';
		for (var i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		return str;
	}

	// Return final URI
	return hex2ascii(decrypted.toString());
}

var megadownloaderappDecrypt = function(str) {
	// Password is "k1o6Al-1kz¿!z05y", but System.Text.Encoding.ASCII.GetBytes in VB.NET replaces 8-bit characters with '?'
	var password = "k1o6Al-1kz?!z05y";

	// IV = {121, 241, 10, 1, 132, 74, 11, 39, 255, 91, 45, 78, 14, 211, 22, 62}
	var iv = CryptoJS.enc.Hex.parse("79F10A01844A0B27FF5B2D4E0ED3163E");

	while (password.length < 32) {
		password += "X";
	} // 256 bit password padding

	// Recover Base64 from encoded string
	var b64str = str;
	b64str += "==".substring((2 - b64str.length * 3) & 3);
	b64str = b64str.replace(new RegExp("-", 'g'), "+").replace(new RegExp("_", 'g'), "/").replace(new RegExp(",", 'g'), "");

	// Decoding step
	var encryptedText = CryptoJS.enc.Base64.parse(b64str);
	var key = CryptoJS.enc.Utf8.parse(password);
	var aes = CryptoJS.algo.AES.createDecryptor(key, {
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
		iv: iv
	});
	var decrypted = aes.finalize(encryptedText);

	// Helper function to convert hex to ASCII
	var hex2ascii = function(hex) {
		var str = '';
		for (var i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		return str;
	}

	// Return final URI
	return hex2ascii(decrypted.toString());
};

$(document).ready(function() {
	var 		 result = $('#result')[0],
						error = $('#error')[0],
						 copy = $('#copy')[0],
						clear = $('#clear')[0],
			resultInput	= $('#result-input')[0],
						 link = $('#link')[0],
					decrypt = $('#decrypt')[0];
					
	$('#link').val('');
	$('#link').focus();
	$('#error').parent('div.alert').hide();
	$('#result-input').hide();
	$('body > div > main > div:nth-child(5)').hide();
	
	// add event listeners
	decrypt.addEventListener('click', function(event) {
		decrypt.disabled = true;
		link.setAttribute('readonly', true);
		result.innerHTML = '';
		error.innerHTML = '';
		$('#error').parent('div.alert').hide();
		try {
			if (!link.value) {
				throw new Error("No URL")
			}
			originURL = decryptURL(link.value);
			result.href = originURL;
			result.innerHTML = originURL;
			resultInput.value = originURL;
			$('body > div > main > div:nth-child(5)').show();
		} catch (e) {
			$('body > div > main > div:nth-child(5)').hide();
			error.innerHTML = e.message;
			decrypt.disabled = false;
			link.removeAttribute('readonly');
			$('#error').parent('div.alert').show();
		}
	});
	link.addEventListener('keyup', function(event) {
		event.preventDefault();
		if (event.keyCode === 13) {
			decrypt.click();
		}
	});
	copy.addEventListener('click', function(event) {
		$('#result-input').show();
		resultInput.select();
		document.execCommand('copy');
		$('#result-input').hide();
	});
	clear.addEventListener('click', function(event) {
		$('#link').val('');
		$('#link').focus();
		$('#error').hide();
		decrypt.disabled = false;
		link.removeAttribute('readonly');
		$('body > div > main > div:nth-child(5)').hide();
	});
});