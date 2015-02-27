'use strict';

var components = require('./models/components');

var FlagGate = function () {};

FlagGate.prototype.init = function (flags) {
	this.flags = flags;
};

FlagGate.prototype.isOn = function (name) {
	return this.flags.get(name).isSwitchedOn;
};

FlagGate.prototype.isOff = function (name) {
	return this.flags.get(name).isSwitchedOff;
};

FlagGate.prototype.buildModel = function (name) {

	// TODO hook into flag client on update event and only cache result of all these calculations between updates
	var modelConf = components[name] || {};
	var model = {};

	Object.keys(modelConf).forEach(function (prop) {
		// handle complex comnbinations of flags
		if (typeof modelConf[prop] == 'function') {
			return model[prop] = modelConf[prop](this.flags);
		}

		// otherwise just build from lists of flags that shoudl be on and/or off
		if (modelConf[prop].on) {
			model[prop] = modelConf[prop].on.reduce(function (state, flag) {
				return state && this.isOn(flag);
			}.bind(this), true)
		}
		if (modelConf[prop].off) {
			model[prop] = model[prop] && modelConf[prop].off.reduce(function (state, flag) {
				return state && this.isOff(flag);
			}.bind(this), true)
		}
	}.bind(this));

	return model;
};

// Takes a componentName and the desired config
// Any property dependent on the presence of some flags will be turned off if they are in teh wrong state
FlagGate.prototype.gate = function (componentName, obj) {
	var flaggyModel = this.buildModel(componentName);
	var gatedModel = {};
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			gatedModel[key] = obj[key];
		}
	}
	Object.keys(flaggyModel).forEach(function (prop) {
		if (typeof gatedModel[prop] === 'undefined') {
			gatedModel[prop] = flaggyModel[prop];
		} else {
			gatedModel[prop] = flaggyModel[prop] && gatedModel[prop];
		}
	});
	return gatedModel;
};

module.exports = FlagGate;
