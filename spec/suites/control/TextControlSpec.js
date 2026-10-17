import {expect} from 'vite-plus/test';
import {MaplairMap, TextControl} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('TextControl', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([0, 0], 1);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('shows HTML content', () => {
		const control = new TextControl({content: '<b>Title</b>', className: 'my-text'}).addTo(map);
		const el = control.getContainer();
		expect(el.parentNode).to.equal(map._controlCorners.topright);
		expect(el.classList.contains('maplair-control-text')).to.be.true;
		expect(el.classList.contains('my-text')).to.be.true;
		expect(el.innerHTML).to.equal('<b>Title</b>');
		expect(el.hidden).to.be.false;
	});

	it('shows an element as content', () => {
		const span = document.createElement('span');
		const control = new TextControl({content: span}).addTo(map);
		expect(control.getContainer().firstChild).to.equal(span);
	});

	it('changes the content with setContent and hides while empty', () => {
		const control = new TextControl().addTo(map);
		const el = control.getContainer();
		expect(el.hidden).to.be.true;

		expect(control.setContent('Loaded')).to.equal(control);
		expect(control.getContent()).to.equal('Loaded');
		expect(el.textContent).to.equal('Loaded');
		expect(el.hidden).to.be.false;
		expect(getComputedStyle(el).display).not.to.equal('none');

		control.setContent('');
		expect(el.hidden).to.be.true;
		expect(getComputedStyle(el).display).to.equal('none');
	});

	it('keeps the content set before adding', () => {
		const control = new TextControl().setContent('early').addTo(map);
		expect(control.getContainer().textContent).to.equal('early');
	});

	it('does not propagate clicks to the map', () => {
		const control = new TextControl({content: 'x'}).addTo(map);
		let clicked = false;
		map.on('click', () => { clicked = true; });
		UIEventSimulator.fire('click', control.getContainer());
		expect(clicked).to.be.false;
	});
});
