'use script'

var expect = require('chai').expect;
var sinon = require('sinon');
var FlagGate = require('../flag-gate');
var flagClient = require('next-feature-flags-client');
flagClient.setUrl('http://host.com/path');

function simpleFlags(i) {

	i = i || 1;
	var flags = {};

	while (i > 0) {
		flags['flag' + i + 'on'] = {
			isSwitchedOn: true,
			isSwitchedOff: false,
			isPastSellByDate: false,
		};

		flags['flag' + i + 'off'] = {
			isSwitchedOn: false,
			isSwitchedOff: true,
			isPastSellByDate: false,
		};
		i--;
	}
	return flags;
}


describe('component flag gate', function () {
	// var server;
	var flagStub;

	// it('should alter config based on current flag state', function (){
	// server = sinon.fakeServer.create();
	// server.respondWith("GET", "/__flags.json", [200, { "Content-Type": "application/json" }, JSON.stringify(flags)]);

	var flagStub;

	function setUp (flags, conditions) {
		flagStub = sinon.stub(flagClient, 'get', function (name) {
			return flags[name];
		});
		return new FlagGate().init(flagClient, {
			component: conditions
		});
	}

	afterEach(function () {
		flagStub.restore();
	});

	it('should initialise chainably', function () {
		var gate = setUp();
		expect(gate instanceof FlagGate).to.be.true;
	});

	describe('flag-mapping interface', function () {
		it('should recognise flagname strings', function () {
			var gate = setUp(simpleFlags(), {
				prop1: {on: 'flag1on'},
				prop2: {off: 'flag1off'},
				prop3: {on: 'flag1off'},
				prop4: {off: 'flag1on'}
			});
			expect(gate.gate('component', {}).prop1).to.be.true;
			expect(gate.gate('component', {}).prop2).to.be.true;
			expect(gate.gate('component', {}).prop3).to.be.false;
			expect(gate.gate('component', {}).prop4).to.be.false;
		});

		it('should recognise arrays of flagname strings', function () {
			var gate = setUp(simpleFlags(2), {
				prop1: {on: ['flag1on', 'flag2on']},
				prop2: {off: ['flag1off', 'flag2off']},
				prop3: {on: ['flag1off', 'flag2on']},
				prop4: {off: ['flag1off', 'flag2on']}
			});
			expect(gate.gate('component', {}).prop1).to.be.true;
			expect(gate.gate('component', {}).prop2).to.be.true;
			expect(gate.gate('component', {}).prop3).to.be.false;
			expect(gate.gate('component', {}).prop4).to.be.false;
		});

		it('should handle complex combinations of on/off conditions', function () {
			var gate = setUp(simpleFlags(3), {
				prop1: {on: ['flag1on'], off: ['flag2off']},
				prop2: {on: 'flag1on', off: ['flag2off', 'flag3off']},
				prop3: {on: ['flag1off'], off: ['flag2off']},
				prop4: {on: ['flag1on', 'flag2off'], off: 'flag3off'},
			});
			expect(gate.gate('component', {}).prop1).to.be.true;
			expect(gate.gate('component', {}).prop2).to.be.true;
			expect(gate.gate('component', {}).prop3).to.be.false;
			expect(gate.gate('component', {}).prop4).to.be.false;
		});

		it('should allow more nuanced combinations to be defined using a function', function () {
			var gate = setUp(simpleFlags(3), {
				prop1: function (flags) {
					return (flags.get('flag1on').isSwitchedOn || flags.get('flag2on').isSwitchedOn ) && flags.get('flag3off').isSwitchedOff;
				},
				prop2: function (flags) {
					return (flags.get('flag1on').isSwitchedOn && flags.get('flag2off').isSwitchedOn ) || flags.get('flag3off').isSwitchedOn;
				}
			});
			expect(gate.gate('component', {}).prop1).to.be.true;
			expect(gate.gate('component', {}).prop2).to.be.false;
		});

	});

	describe('gating', function () {
		it('should leave property unchanged when no flagging defined', function () {
			var gate = setUp();
			expect(gate.gate('component', {
				prop: 'it'
			}).prop).to.equal('it');
		});

		it('should output flagged property by default if no user defined property', function () {
			var gate = setUp(simpleFlags(), {
				prop1: {on: 'flag1on'},
				prop2: {on: 'flag1off'}
			});
			expect(gate.gate('component', {}).prop1).to.equal(true);
			expect(gate.gate('component', {}).prop2).to.equal(false);
		});

		it('should preserve property if flags satisfied', function () {
			var gate = setUp(simpleFlags(), {
				prop: {on: 'flag1on'}
			});
			expect(gate.gate('component', {
				prop: 'it'
			}).prop).to.equal('it');
		});

		it('should output false if flags not satisfied', function () {
			var gate = setUp(simpleFlags(), {
				prop: {on: 'flag1off'}
			});
			expect(gate.gate('component', {
				prop: 'it'
			}).prop).to.equal(false);
		});

		it('should not alter original object (make part of every test)', function () {
			var gate = setUp(simpleFlags(), {
				prop: {on: 'flag1off'}
			});
			var obj = {
				prop: 'it'
			};
			var gatedObj = gate.gate('component', obj);
			expect(obj).not.to.equal(gatedObj);
			expect(obj.prop).to.equal('it');
		});

		xit('should cache results inbetween flag updates', function () {

		});

	});



});
