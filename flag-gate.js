'use strict';

var components = require('./models/components');

var FlagGate = function () {};

FlagGate.prototype.init = function (flags, models) {
	this.flags = flags;
	this.models = models || components;
	return this;
};

FlagGate.prototype.isOn = function (name) {
	return this.flags.get(name).isSwitchedOn;
};

FlagGate.prototype.isOff = function (name) {
	return this.flags.get(name).isSwitchedOff;
};

FlagGate.prototype.buildModel = function (name) {

	// TODO hook into flag client on update event and only cache result of all these calculations between updates
	var flagConf = this.models[name] || {};
	var model = {};
	Object.keys(flagConf).forEach(function (prop) {
		// handle complex comnbinations of flags
		if (typeof flagConf[prop] == 'function') {
			return model[prop] = !!flagConf[prop](this.flags);
		}
		model[prop] = true;
		// otherwise just build from lists of flags that shoulD be on and/or off
		if (flagConf[prop].on) {
			if (typeof flagConf[prop].on === 'string') {
				model[prop] = this.isOn(flagConf[prop].on);
			} else {
				model[prop] = flagConf[prop].on.reduce(function (state, flag) {
					return state && this.isOn(flag);
				}.bind(this), model[prop])
			}
		}
		if (flagConf[prop].off) {
			if (typeof flagConf[prop].off === 'string') {
				console.log(prop, model[prop], flagConf[prop].off, this.isOff(flagConf[prop].off));
				model[prop] = model[prop] && this.isOff(flagConf[prop].off);
			} else {
				model[prop] = model[prop] && flagConf[prop].off.reduce(function (state, flag) {
					return state && this.isOff(flag);
				}.bind(this), model[prop])
			}
		}

		model[prop] = !!model[prop]
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
