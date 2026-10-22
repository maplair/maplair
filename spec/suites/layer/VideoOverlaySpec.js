import {expect} from 'vite-plus/test';
import {LatLngBounds, MaplairMap, Point, VideoOverlay} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import Hand from 'prosthetic-hand';

describe('VideoOverlay', () => {
	let container, map;
	const videoBounds = new LatLngBounds([[32, -130], [13, -100]]);

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([20, -115], 4);	// view needs to be set so when layer is added it is initialized
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('create VideoOverlay', () => {
		const videoUrls = [
			'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
			'https://www.mapbox.com/bites/00188/patricia_nasa.mp4'
		];

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds).addTo(map);

		expect(map.hasLayer(videoOverlay)).to.be.true;
	});

	it('create VideoOverlay from a video element with source elements', () => {
		const videoUrls = [
			'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
			'https://www.mapbox.com/bites/00188/patricia_nasa.mp4'
		];

		const video = document.createElement('video');
		for (const url of videoUrls) {
			const source = document.createElement('source');
			source.src = url;
			video.appendChild(source);
		}

		const videoOverlay = new VideoOverlay(video, videoBounds).addTo(map);

		expect(map.hasLayer(videoOverlay)).to.be.true;
		expect(videoOverlay.getElement()).to.equal(video);
		expect(video.parentNode).to.equal(map.getPane('overlayPane'));
		expect(video.getElementsByTagName('source').length).to.equal(2);
		expect(videoOverlay._url).to.eql(videoUrls);
	});

	it('create VideoOverlay from a video element with a src attribute', () => {
		const videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm';

		const video = document.createElement('video');
		video.src = videoUrl;

		const videoOverlay = new VideoOverlay(video, videoBounds).addTo(map);

		expect(map.hasLayer(videoOverlay)).to.be.true;
		expect(videoOverlay.getElement()).to.equal(video);
		expect(videoOverlay._url).to.eql([videoUrl]);
	});

	// Drags across the video with pointer events (VideoOverlay listens to `pointerdown`)
	// and resolves with how far the map pane moved, in pixels. Pixels rather than
	// LatLng, since the map center may snap to whole pixels at any time.
	function dragAcrossVideo() {
		return new Promise((resolve) => {
			const before = map._getMapPanePos();
			const hand = new Hand({
				timing: 'fastframe',
				onStop() {
					resolve(map._getMapPanePos().subtract(before));
				}});
			const mouse = hand.growFinger('pointer', {pointerType: 'mouse'});
			mouse.moveTo(200, 200, 100)
				.down().moveBy(50, 50, 10).up();
		});
	}

	it('drags the map while mousemove on video', async () => {

		const videoUrls = [
			'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
			'https://www.mapbox.com/bites/00188/patricia_nasa.mp4'
		];

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds, {interactive: true}).addTo(map);
		expect(map.hasLayer(videoOverlay)).to.be.true;

		const offset = await dragAcrossVideo();
		expect(offset.x).to.be.at.least(50);
		expect(offset.y).to.be.at.least(50);
	});

	it('don\'t drags the map if video has enabled controls', async () => {

		const videoUrls = [
			'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
			'https://www.mapbox.com/bites/00188/patricia_nasa.mp4'
		];

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds, {interactive: true}).addTo(map);
		(videoOverlay.getElement()).controls = true;
		expect(map.hasLayer(videoOverlay)).to.be.true;

		const offset = await dragAcrossVideo();
		expect(offset).to.eql(new Point(0, 0));
	});
});
