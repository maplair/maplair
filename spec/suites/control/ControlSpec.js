import {expect, vi} from 'vite-plus/test';
import {Control, DomUtil, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Control', () => {
	function onAdd() {
		return DomUtil.create('div', 'maplair-test-control');
	}

	let map,
	container,
	control;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);

		map.setView([0, 0], 1);
		control = new Control();
		control.onAdd = onAdd;
		control.addTo(map);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('#addTo', () => {
		it('adds the container to the map', () => {
			expect(map.getContainer().querySelector('.maplair-test-control')).to.equal(control.getContainer());
		});

		it('removes the control from any existing map', () => {
			control.addTo(map);
			expect(map.getContainer().querySelectorAll('.maplair-test-control').length).to.equal(1);
			expect(map.getContainer().querySelector('.maplair-test-control')).to.equal(control.getContainer());
		});
	});

	describe('#remove', () => {
		it('removes the container from the map', () => {
			control.remove();
			expect(map.getContainer().querySelector('.maplair-test-control')).to.equal(null);
		});

		it('calls onRemove if defined', () => {
			control.onRemove = vi.fn();
			control.remove();
			expect(control.onRemove).toHaveBeenCalled();
		});

		it('is a no-op if the control has not been added', () => {
			const control = new Control();
			expect(control.remove()).to.equal(control);
		});
	});

	describe('order option', () => {
		function addControl(position, order) {
			const c = new Control({position, order});
			c.onAdd = onAdd;
			return c.addTo(map);
		}

		function names(corner, controls) {
			return Array.from(corner.children, el => Object.keys(controls).find(name => controls[name].getContainer() === el)).join('');
		}

		it('sorts the controls of a top corner from the corner of the map', () => {
			const corner = map._controlCorners.topleft;
			corner.replaceChildren();
			const a = addControl('topleft'),
			b = addControl('topleft', 2),
			c = addControl('topleft', -1),
			d = addControl('topleft', 1),
			e = addControl('topleft');
			expect(names(corner, {a, b, c, d, e})).to.equal('caedb');
		});

		it('sorts the controls of a bottom corner from the corner of the map', () => {
			const corner = map._controlCorners.bottomright;
			corner.replaceChildren();
			const a = addControl('bottomright'),
			b = addControl('bottomright', 2),
			c = addControl('bottomright', -1),
			d = addControl('bottomright', 1),
			e = addControl('bottomright');
			expect(names(corner, {a, b, c, d, e})).to.equal('bdeac');
		});
	});
});
