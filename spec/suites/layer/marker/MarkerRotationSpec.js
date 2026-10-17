import {expect} from 'vite-plus/test';
import {DivIcon, MaplairMap, Marker} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('Marker: rotationAngle', () => {
	let container, map;
	const latlng = [10, 20];

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView(latlng, 5);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	// The container point of the marker's position, and the box of the icon in container pixels
	function iconBox(marker) {
		const rect = marker.getElement().getBoundingClientRect(),
		origin = container.getBoundingClientRect();
		return {
			point: map.latLngToContainerPoint(latlng),
			left: rect.left - origin.left, right: rect.right - origin.left,
			top: rect.top - origin.top, bottom: rect.bottom - origin.top
		};
	}

	it('is not rotated by default', () => {
		const marker = new Marker(latlng).addTo(map);
		expect(marker.getElement().style.transform).not.to.contain('rotate');
	});

	it('rotates the icon around its anchor', () => {
		const marker = new Marker(latlng, {rotationAngle: 180}).addTo(map),
		icon = marker.getElement();
		expect(icon.style.transform).to.contain('rotate(180deg)');
		const anchor = marker.options.icon.options.iconAnchor;
		// Firefox serializes the z component
		expect(icon.style.transformOrigin).to.match(new RegExp(`^${anchor[0]}px ${anchor[1]}px( 0px)?$`));

		// upside down: the pin hangs below its position
		const box = iconBox(marker);
		expect(box.top).to.be.closeTo(box.point.y, 1);
		expect(box.bottom).to.be.greaterThan(box.point.y + 30);
	});

	it('does not rotate the shadow', () => {
		const marker = new Marker(latlng, {rotationAngle: 90}).addTo(map);
		expect(marker._shadow.style.transform).not.to.contain('rotate');
	});

	it('changes the angle with setRotationAngle', () => {
		const marker = new Marker(latlng).addTo(map);
		expect(marker.setRotationAngle(90)).to.equal(marker);
		expect(marker.getElement().style.transform).to.contain('rotate(90deg)');
		// pointing right
		const box = iconBox(marker);
		expect(box.left).to.be.closeTo(box.point.x, 1);

		marker.setRotationAngle(0);
		expect(marker.getElement().style.transform).not.to.contain('rotate');
		expect(marker.getElement().style.transformOrigin).to.equal('');
	});

	it('rotates around the rotationOrigin', () => {
		const marker = new Marker(latlng, {
			icon: new DivIcon({iconSize: [20, 10]}),
			rotationAngle: 90,
			rotationOrigin: 'center'
		}).addTo(map);
		expect(marker.getElement().style.transformOrigin).to.contain('center center');
		marker.setRotationOrigin('0px 0px');
		expect(marker.getElement().style.transformOrigin).to.contain('0px 0px');
	});

	it('keeps the angle relative to the screen on a rotated map', () => {
		const marker = new Marker(latlng, {rotationAngle: 45}).addTo(map);
		map.setBearing(30);
		expect(marker.getElement().style.transform).to.contain('rotate(75deg)');
		expect(marker._shadow.style.transform).to.contain('rotate(30deg)');
	});

	it('keeps the angle relative to north with rotateWithView', () => {
		const marker = new Marker(latlng, {rotationAngle: 45, rotateWithView: true}).addTo(map);
		map.setBearing(30);
		expect(marker.getElement().style.transform).to.contain('rotate(45deg)');
		expect(marker._shadow.style.transform).not.to.contain('rotate');
	});

	it('keeps the rotation while dragging', () => {
		const marker = new Marker(latlng, {rotationAngle: 45, draggable: true}).addTo(map);
		marker.dragging._draggable._newPos = marker.dragging._draggable._startPos = map.latLngToLayerPoint(latlng);
		marker.dragging._draggable.fire('drag', {});
		expect(marker.getElement().style.transform).to.contain('rotate(45deg)');
	});
});
