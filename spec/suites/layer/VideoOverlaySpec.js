import {expect, vi} from 'vite-plus/test';
import {LatLngBounds, MaplairMap, Point, VideoOverlay} from 'maplair';
import {createContainer, removeMapContainer, Finger} from '../SpecHelper.js';

describe('VideoOverlay', () => {
	let container, map;
	const videoBounds = new LatLngBounds([[32, -130], [13, -100]]);

	// empty data URIs so no test has to fetch a real video over the network
	const videoUrl = 'data:video/webm;base64,';
	const videoUrls = [videoUrl, 'data:video/mp4;base64,'];

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([20, -115], 4);	// view needs to be set so when layer is added it is initialized
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('keeps its size despite a max-width on videos in the page', () => {
		const style = document.createElement('style');
		style.textContent = 'video { max-width: 10px; max-height: 10px; }';
		document.head.append(style);

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds).addTo(map);
		const {maxWidth, maxHeight} = getComputedStyle(videoOverlay.getElement());
		style.remove();

		expect([maxWidth, maxHeight]).to.eql(['none', 'none']);
	});

	it('autoplays the video, or shows its controls with reduced motion', () => {
		const video = new VideoOverlay(videoUrls, videoBounds).addTo(map).getElement();
		expect(video.autoplay).to.be.true;
		expect(video.controls).to.be.false;

		const matchMedia = window.matchMedia.bind(window);
		const reduced = query => (query === '(prefers-reduced-motion: reduce)' ? {matches: true} : matchMedia(query));
		vi.spyOn(window, 'matchMedia').mockImplementation(reduced);
		const reducedVideo = new VideoOverlay(videoUrls, videoBounds).addTo(map).getElement();
		vi.restoreAllMocks();
		expect(reducedVideo.autoplay).to.be.false;
		expect(reducedVideo.controls).to.be.true;
	});

	it('create VideoOverlay', () => {
		const videoOverlay = new VideoOverlay(videoUrls, videoBounds).addTo(map);

		expect(map.hasLayer(videoOverlay)).to.be.true;
	});

	it('create VideoOverlay from a video element with source elements', () => {
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
		const video = document.createElement('video');
		video.src = videoUrl;

		const videoOverlay = new VideoOverlay(video, videoBounds).addTo(map);

		expect(map.hasLayer(videoOverlay)).to.be.true;
		expect(videoOverlay.getElement()).to.equal(video);
		expect(videoOverlay._url).to.eql([videoUrl]);
	});

	it('stretches the video to its bounds with keepAspectRatio: false', () => {
		const keptOverlay = new VideoOverlay(videoUrl, videoBounds).addTo(map);
		const stretchedOverlay = new VideoOverlay(videoUrl, videoBounds, {keepAspectRatio: false}).addTo(map);

		expect(getComputedStyle(keptOverlay.getElement()).objectFit).to.equal('contain');
		expect(getComputedStyle(stretchedOverlay.getElement()).objectFit).to.equal('fill');
	});

	it('uses the z-index specified in options', () => {
		const overlay = new VideoOverlay(videoUrl, videoBounds, {zIndex: 20}).addTo(map);
		expect(overlay.getElement().style.zIndex).to.equal('20');
	});

	it('sets the z-index when added to the map, e.g. by the layers control', () => {
		const overlay = new VideoOverlay(videoUrl, videoBounds).setZIndex(10).addTo(map);
		expect(overlay.getElement().style.zIndex).to.equal('10');
	});

	// Drags across the video with pointer events (VideoOverlay listens to `pointerdown`)
	// and resolves with how far the map pane moved, in pixels. Pixels rather than
	// LatLng, since the map center may snap to whole pixels at any time.
	async function dragAcrossVideo() {
		const before = map._getMapPanePos();
		await new Finger().moveTo(200, 200).down().moveBy(50, 50).up();
		return map._getMapPanePos().subtract(before);
	}

	it('drags the map while mousemove on video', async () => {

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds, {interactive: true}).addTo(map);
		expect(map.hasLayer(videoOverlay)).to.be.true;

		const offset = await dragAcrossVideo();
		expect(offset.x).to.be.at.least(50);
		expect(offset.y).to.be.at.least(50);
	});

	it('don\'t drags the map if video has enabled controls', async () => {

		const videoOverlay = new VideoOverlay(videoUrls, videoBounds, {interactive: true}).addTo(map);
		(videoOverlay.getElement()).controls = true;
		expect(map.hasLayer(videoOverlay)).to.be.true;

		const offset = await dragAcrossVideo();
		expect(offset).to.eql(new Point(0, 0));
	});
});
