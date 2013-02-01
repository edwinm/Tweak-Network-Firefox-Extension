// Copyright 2004-2012 Edwin Martin <edwin@bitstorm.org>
// This code is triple licensed under MPL/GPL/LGPL. See license.txt for details.

// Watch uninstall
window.addEventListener("load", observeUninstall, false);

function load() {
	showWarning();
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("network.http.");
	loadSettings(prefs);
}

// Prefs -> UI
function loadSettings(prefs) {
	var inputs = document.getElementsByTagName("textbox");
	for ( var i=0; i<inputs.length; i++ ) {
		if (prefs.getPrefType(inputs[i].id) == prefs.PREF_INT) {
			try {
				inputs[i].value = prefs.getIntPref( inputs[i].id );
			} catch ( e ) {
				// ignore
			}
		}
	}
	var inputs = document.getElementsByTagName("checkbox");
	for ( var i=0; i<inputs.length; i++ ) {
		if (prefs.getPrefType(inputs[i].id) == prefs.PREF_BOOL)
			inputs[i].checked = prefs.getBoolPref(inputs[i].id);
	}
}

// UI -> Prefs
function saveSettings() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("network.http.");
	var inputs = document.getElementsByTagName("textbox");
	for ( var i=0; i<inputs.length; i++ ) {
		prefs.setIntPref(inputs[i].id, inputs[i].value);
	}
	var inputs = document.getElementsByTagName("checkbox");
	for ( var i=0; i<inputs.length; i++ ) {
		prefs.setBoolPref(inputs[i].id, inputs[i].checked);
	}
}

function setFormDefault() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getDefaultBranch("network.http.");
	loadSettings(prefs)
}

function setFormPower() {
	var settings = getPowerSettings();
	setForm(settings);
}

function getPowerSettings() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getDefaultBranch("network.http.");
	var power = {
		"max-connections": 256,
		"max-connections-per-server": 16,
		"max-persistent-connections-per-server": 16,
		"max-persistent-connections-per-proxy": 16,
		"pipelining": true,
		"proxy.pipelining": true,
		"pipelining.maxrequests": 8
	};

	// Make sure the power settings are not smaller than default settings
	// In Fx 7, max connections was increased to 256
	for ( var i in power ) {
		var setting;
		switch ( typeof power[i] ) {
			case "number":
				try {
					var defaultSetting = prefs.getIntPref( i );
					if ( defaultSetting > power[i] ) {
						power[i] = defaultSetting;
					}
				} catch ( e ) {
					// ignore
				}
				break;
		}
	}

	return power;
}

function getCurrentSettings() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("network.http.");
	var settings = getPowerSettings();
	for ( var i in settings ) {
		switch ( typeof settings[i] ) {
			case "number":
				settings[i] = prefs.getIntPref(i);
				break;
			case "boolean":
				settings[i] = prefs.getBoolPref(i);
				break;
		}
	}
	return settings;
}

function setSettings(settings) {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("network.http.");
	for ( var i in settings ) {
		switch ( typeof settings[i] ) {
			case "number":
				prefs.setIntPref(i, settings[i]);
				break;
			case "boolean":
				prefs.setBoolPref(i, settings[i]);
				break;
		}
	}
}

function setForm(settings) {
	for ( var i in settings ) {
		switch ( typeof settings[i] ) {
			case "number":
				document.getElementById(i).value = settings[i];
				break;
			case "boolean":
				document.getElementById(i).checked = settings[i];
				break;
		}
	}
}

function resetSettings() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getDefaultBranch("network.http.");
	var settings = getPowerSettings();
	for (var i in settings) {
		prefs.clearUserPref(i);
	}
}

// https://developer.mozilla.org/en/Code_snippets/Dialogs_and_Prompts#Passing_arguments_and_displaying_a_dialog
function showDialog() {
	window.openDialog("chrome://tweak/content/tweak.xul", "tweak-dialog", "chrome,centerscreen");
}

function showWarning() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.tweak.");
	if (prefs.getPrefType("no-warning") != prefs.PREF_BOOL || !prefs.getBoolPref("no-warning")) {
		window.openDialog("chrome://tweak/content/tweakWarning.xul", "tweak-warning", "chrome,modal,top="+(screen.height/2-200)+",left="+(screen.width/2-271)+",resizable=no");
	}
}

function warningOk() {
	if ( document.getElementById("show-warning").checked ) {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.tweak.");
		prefs.setBoolPref("no-warning", true);
	}
	window.close();
}

// https://developer.mozilla.org/en/Observer_Notifications
// https://developer.mozilla.org/en/nsIObserver
// https://developer.mozilla.org/en/Code_snippets/Preferences#Using_preference_observers
function observeUninstall() {
	function tweakObserver() {
		this.register();
	}
	
	tweakObserver.prototype = {
		previousSettings: [],
		observe: function(subject, topic, data) {
			subject.QueryInterface(Components.interfaces.nsIUpdateItem);
			if (subject.id == "{DAD0F81A-CF67-4eed-98D6-26F6E47274CA}") {
				if (data == "item-uninstalled") {
					this.previousSettings = getCurrentSettings();
					resetSettings();
				} else if (data == "item-cancel-action") {
					setSettings(this.previousSettings);
				}
			}
		},
		register: function() {
			var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
			observerService.addObserver(this, "em-action-requested", false);
		},
		unregister: function() {
			var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
			observerService.removeObserver(this, "em-action-requested");
		}
	};

	new tweakObserver();
}



