import {expect, vi} from 'vite-plus/test';
import {ButtonBarControl, ButtonControl, MaplairMap} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('ButtonControl', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomControl: false});
		map.setView([0, 0], 1);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('adds a button calling onClick', () => {
		const onClick = vi.fn();
		const control = new ButtonControl({content: '<b>⌂</b>', title: 'Home', onClick}).addTo(map);
		const button = control.getButton();

		expect(button.tagName).to.equal('BUTTON');
		expect(button.type).to.equal('button');
		expect(button.parentNode.classList.contains('maplair-bar')).to.be.true;
		expect(button.innerHTML).to.equal('<b>⌂</b>');
		expect(button.title).to.equal('Home');
		expect(button.getAttribute('aria-label')).to.equal('Home');

		const mapClick = vi.fn();
		map.on('click', mapClick);
		UIEventSimulator.fire('click', button);
		expect(onClick).toHaveBeenCalledOnce();
		const [e, buttonControl, theMap] = onClick.mock.calls[0];
		expect(e.type).to.equal('click');
		expect(buttonControl).to.equal(control);
		expect(theMap).to.equal(map);
		expect(mapClick).not.toHaveBeenCalled();
	});

	it('accepts an element as content', () => {
		const icon = document.createElement('span');
		const control = new ButtonControl({content: icon, title: 'Icon'}).addTo(map);
		expect(control.getButton().firstChild).to.equal(icon);
	});

	it('switches between states', () => {
		const show = vi.fn((e, button) => { button.setState('hide'); }),
		hide = vi.fn((e, button) => { button.setState('show'); });
		const control = new ButtonControl({
			states: [
				{name: 'show', content: 'S', title: 'Show', onClick: show},
				{name: 'hide', content: 'H', title: 'Hide', onClick: hide}
			]
		}).addTo(map);
		const button = control.getButton();
		expect(control.getState()).to.equal('show');
		expect(button.textContent).to.equal('S');

		UIEventSimulator.fire('click', button);
		expect(show).toHaveBeenCalledOnce();
		expect(control.getState()).to.equal('hide');
		expect(button.textContent).to.equal('H');
		expect(button.title).to.equal('Hide');
		expect(button.dataset.state).to.equal('hide');

		UIEventSimulator.fire('click', button);
		expect(hide).toHaveBeenCalledOnce();
		expect(control.getState()).to.equal('show');

		expect(() => control.setState('unknown')).to.throw();
	});

	it('can be disabled', () => {
		const onClick = vi.fn();
		const control = new ButtonControl({content: 'X', title: 'X', onClick}).addTo(map);
		control.disable();
		expect(control.getButton().classList.contains('maplair-disabled')).to.be.true;
		expect(control.getButton().getAttribute('aria-disabled')).to.equal('true');
		UIEventSimulator.fire('click', control.getButton());
		expect(onClick).not.toHaveBeenCalled();

		control.enable();
		UIEventSimulator.fire('click', control.getButton());
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('has the size of the zoom control buttons', () => {
		const control = new ButtonControl({content: 'X', title: 'X'}).addTo(map);
		expect(control.getButton().offsetWidth).to.equal(30);
	});

	it('groups buttons in a bar', () => {
		const a = vi.fn(), b = vi.fn();
		const bar = new ButtonBarControl([
			new ButtonControl({content: 'A', title: 'A', onClick: a}),
			new ButtonControl({content: 'B', title: 'B', onClick: b})
		], {position: 'topright'}).addTo(map);

		const buttons = bar.getContainer().querySelectorAll('button');
		expect(buttons).to.have.length(2);
		expect(bar.getContainer().parentNode.classList.contains('maplair-right')).to.be.true;
		UIEventSimulator.fire('click', buttons[1]);
		expect(b).toHaveBeenCalledOnce();
		expect(b.mock.calls[0][2]).to.equal(map);
		expect(a).not.toHaveBeenCalled();

		bar.remove();
		expect(bar.getButtons()[0]._map).to.equal(null);
	});

	it('has an access key, shown in the title', () => {
		const button = new ButtonControl({content: '⌂', title: 'Home', accessKey: 'h'}).addTo(map).getButton();
		expect(button.accessKey).to.equal('h');
		expect(button.title.startsWith('Home [')).to.be.true;
		expect(button.title.endsWith('H]')).to.be.true;
		expect(button.getAttribute('aria-label')).to.equal('Home');
	});
});
