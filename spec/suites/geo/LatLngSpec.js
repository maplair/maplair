import {expect} from 'vite-plus/test';
import {LatLng} from 'maplair';

describe('LatLng', () => {
	describe('constructor', () => {
		it('sets lat and lng', () => {
			const a = new LatLng(25, 74);
			expect(a.lat).to.eql(25);
			expect(a.lng).to.eql(74);

			const b = new LatLng(-25, -74);
			expect(b.lat).to.eql(-25);
			expect(b.lng).to.eql(-74);
		});

		it('throws an error if invalid lat or lng', () => {
			expect(() => {
				new LatLng(NaN, NaN);
			}).to.throw();
		});

		it('does not set altitude if undefined', () => {
			const a = new LatLng(25, 74);
			expect(typeof a.alt).to.eql('undefined');
		});

		it('sets altitude', () => {
			const a = new LatLng(25, 74, 50);
			expect(a.alt).to.eql(50);

			const b = new LatLng(-25, -74, -50);
			expect(b.alt).to.eql(-50);
		});
	});

	describe('validate', () => {
		it('returns true for valid inputs', () => {
			expect(LatLng.validate(50, 30)).to.eql(true);
			expect(LatLng.validate([50, 30])).to.eql(true);
			expect(LatLng.validate({lat: 50, lng: 30})).to.eql(true);
			expect(LatLng.validate(new LatLng(50, 30))).to.eql(true);
		});

		it('returns false for invalid inputs without throwing', () => {
			expect(LatLng.validate(undefined)).to.eql(false);
			expect(LatLng.validate(null)).to.eql(false);
			expect(LatLng.validate('foo')).to.eql(false);
			expect(LatLng.validate([50])).to.eql(false);
		});
	});

	describe('parse', () => {
		// test cases from leaflet-control-geocoder, in decimal degrees
		const parse = (text, lat, lng) => {
			const latlng = LatLng.parse(text);
			expect(latlng, text).to.be.instanceOf(LatLng);
			expect(latlng.lat, text).to.be.closeTo(lat, 1e-9);
			expect(latlng.lng, text).to.be.closeTo(lng, 1e-9);
		};

		it('parses pairs of numbers', () => {
			for (const text of ['50.06773 14.37742', '50.06773, 14.37742', '+50.06773 +14.37742', '+50.06773, +14.37742', '50.06773;14.37742', ' 50.06773° 14.37742° ']) {
				parse(text, 50.06773, 14.37742);
			}
			parse('-50.06773, -14.37742', -50.06773, -14.37742);
		});

		it('parses hemispheres before and after the numbers', () => {
			for (const [lat, lng, texts] of [
				[50.06773, 14.37742, ['N50.06773 E14.37742', 'N50.06773, E14.37742', '50.06773N 14.37742E', '50.06773N, 14.37742E', 'n 50.06773° e 14.37742°', '50.06773° N, 14.37742° E']],
				[50.06773, -14.37742, ['N50.06773 W14.37742', 'N50.06773, W14.37742', '50.06773N 14.37742W', '50.06773N, 14.37742W']],
				[-50.06773, 14.37742, ['S50.06773 E14.37742', 'S50.06773, E14.37742', '50.06773S 14.37742E', '50.06773S, 14.37742E']],
				[-50.06773, -14.37742, ['S50.06773 W14.37742', 'S50.06773, W14.37742', '50.06773S 14.37742W', '50.06773S, 14.37742W', 'W14.37742 S50.06773']]
			]) {
				for (const text of texts) {
					parse(text, lat, lng);
				}
			}
		});

		it('parses geo URIs', () => {
			parse('geo:50.06773,14.37742', 50.06773, 14.37742);
			parse('geo:-50.06773,-14.37742?z=13', -50.06773, -14.37742);
			const latlng = LatLng.parse('geo:50.06773,14.37742,250;u=35');
			expect(latlng.alt).to.equal(250);
		});

		it('returns null for other text', () => {
			for (const text of ['no-lat-lng', '', '50.06773', '50.06773 14.37742 3', 'N50.06773 N14.37742', 'E50 W14', '91 14', '50 181', 'geo:50', 'N 50° 04.064 E 014° 22.645']) {
				expect(LatLng.parse(text), text).to.be.null;
			}
		});
	});

	describe('#equals', () => {
		it('returns true if compared objects are equal within a certain margin', () => {
			const a = new LatLng(10, 20);
			const b = new LatLng(10 + 1.0E-10, 20 - 1.0E-10);
			expect(a.equals(b)).to.eql(true);
		});

		it('returns false if compared objects are not equal within a certain margin', () => {
			const a = new LatLng(10, 20);
			const b = new LatLng(10, 23.3);
			expect(a.equals(b)).to.eql(false);
		});

		it('returns false if passed non-valid object', () => {
			const a = new LatLng(10, 20);
			expect(a.equals(null)).to.eql(false);
		});
	});

	describe('#toString', () => {
		it('formats a string', () => {
			const a = new LatLng(10.333333333, 20.2222222);
			expect(a.toString(3)).to.eql('LatLng(10.333, 20.222)');
			expect(a.toString()).to.eql('LatLng(10.333333, 20.222222)');
		});
	});

	describe('#distanceTo', () => {
		it('calculates distance in meters', () => {
			const a = new LatLng(50.5, 30.5);
			const b = new LatLng(50, 1);

			expect(Math.abs(Math.round(a.distanceTo(b) / 1000) - 2084) < 5).to.eql(true);
		});
		it('does not return NaN if input points are equal', () => {
			const a = new LatLng(50.5, 30.5);
			const b = new LatLng(50.5, 30.5);

			expect(a.distanceTo(b)).to.eql(0);
		});
	});

	describe('LatLng creation', () => {
		it('returns LatLng instance as is', () => {
			const a = new LatLng(50, 30);

			expect(new LatLng(a)).to.eql(a);
		});

		it('accepts an array of coordinates', () => {
			expect(() => new LatLng([])).to.throw();
			expect(() => new LatLng([50])).to.throw();
			expect(new LatLng([50, 30])).to.eql(new LatLng(50, 30));
			expect(new LatLng([50, 30, 100])).to.eql(new LatLng(50, 30, 100));
		});

		it('passes null or undefined as is', () => {
			expect(() => new LatLng(undefined)).to.throw();
			expect(() => new LatLng(null)).to.throw();
		});

		it('creates a LatLng object from two coordinates', () => {
			expect(new LatLng(50, 30)).to.eql(new LatLng(50, 30));
		});

		it('accepts an object with lat/lng', () => {
			expect(new LatLng({lat: 50, lng: 30})).to.eql(new LatLng(50, 30));
		});

		it('accepts an object with lat/lon', () => {
			expect(new LatLng({lat: 50, lon: 30})).to.eql(new LatLng(50, 30));
		});

		it('returns null if lng not specified', () => {
			expect(() => new LatLng(50)).to.throw();
		});

		it('accepts altitude as third parameter', () => {
			expect(new LatLng(50, 30, 100)).to.eql(new LatLng(50, 30, 100));
		});

		it('accepts an object with alt', () => {
			expect(new LatLng({lat: 50, lng: 30, alt: 100})).to.eql(new LatLng(50, 30, 100));
			expect(new LatLng({lat: 50, lon: 30, alt: 100})).to.eql(new LatLng(50, 30, 100));
		});
	});

	describe('copy constructor', () => {
		it('should copy attributes', () => {
			const a = new LatLng(50.5, 30.5, 100);
			const b = new LatLng(a);

			expect(b.lat).to.equal(50.5);
			expect(b.lng).to.equal(30.5);
			expect(b.alt).to.equal(100);
		});

		it('should create another reference', () => {
			const a = new LatLng(50.5, 30.5, 100);
			const b = new LatLng(a);

			expect(a === b).to.be.false;
		});
	});

	describe('.from', () => {
		it('returns LatLng instances as they are', () => {
			const a = new LatLng(50.5, 30.5, 100);
			expect(LatLng.from(a)).to.equal(a);
		});

		it('creates a LatLng from the other formats of the constructor', () => {
			expect(LatLng.from(50.5, 30.5, 100)).to.eql(new LatLng(50.5, 30.5, 100));
			expect(LatLng.from([50.5, 30.5])).to.eql(new LatLng(50.5, 30.5));
			expect(LatLng.from({lat: 50.5, lon: 30.5})).to.eql(new LatLng(50.5, 30.5));
			expect(LatLng.from({lat: 50.5, lng: 30.5})).to.be.an.instanceof(LatLng);
		});

		it('throws an error if invalid', () => {
			expect(() => LatLng.from(NaN, NaN)).to.throw();
		});
	});
});
