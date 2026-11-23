import {expect, vi} from 'vite-plus/test';
import {Circle, CircleMarker, GeoJSON, HeatLayer, ImageOverlay, LatLng, LayerGroup, Marker, MarkerClusterGroup, Polygon, Popup, SVGOverlay, TileLayer, WMSTileLayer} from 'maplair';
import {parseBounds, parseLatLngs, parseOption, parsePoint} from 'maplair/elements';

describe('Elements', () => {
	let container;

	// a map element of 400x300 pixels with the given content
	function render(html) {
		container = document.createElement('div');
		container.innerHTML = html;
		document.body.append(container);
		return container.firstElementChild;
	}

	afterEach(() => {
		container?.remove();
		container = null;
	});

	const tiles = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=#{z}/{x}/{y}';

	describe('parsing', () => {
		it('parses coordinates, bounds and points', () => {
			expect(parseOption('latlng', '47.26,11.39')).to.eql(new LatLng(47.26, 11.39));
			expect(parseLatLngs('1,2 3,4')).to.eql([new LatLng(1, 2), new LatLng(3, 4)]);
			expect(parseLatLngs('0,0 0,10 10,10|1,1 1,2 2,2')).to.have.length(2);
			expect(parseBounds('46,9 48,13').getNorthEast()).to.eql(new LatLng(48, 13));
			expect(parsePoint('12,41')).to.eql([12, 41]);
			expect(parseOption('iconSize', '32')).to.eql([32, 32]);
		});

		it('parses by the type of the default', () => {
			expect(parseOption('maxZoom', '18', 0)).to.equal(18);
			expect(parseOption('noWrap', '', false)).to.equal(true);
			expect(parseOption('noWrap', 'false', false)).to.equal(false);
			expect(parseOption('className', '42', '')).to.equal('42');
			expect(parseOption('fetchOptions', '{"cache": "no-cache"}')).to.eql({cache: 'no-cache'});
			expect(parseOption('foo', '1.5')).to.equal(1.5);
			expect(parseOption('foo', 'bar')).to.equal('bar');
		});
	});

	describe('<maplair-map>', () => {
		it('creates a map in the element with the view of its attributes', () => {
			const el = render('<maplair-map center="47.26,11.39" zoom="10" style="height: 300px"></maplair-map>');
			expect(el.map).to.be.ok;
			expect(el.map.getContainer()).to.equal(el);
			expect(el.map.getZoom()).to.equal(10);
			expect(el.map.getCenter().lat).to.be.closeTo(47.26, 1e-6);
			expect(el.offsetHeight).to.equal(300);
		});

		it('is 400 pixels high by default', () => {
			const el = render('<maplair-map></maplair-map>');
			expect(el.offsetHeight).to.equal(400);
		});

		it('fits bounds', () => {
			const el = render('<maplair-map bounds="46,9 48,13"></maplair-map>');
			expect(el.map.getBounds().contains(parseBounds('46,9 48,13'))).to.be.true;
		});

		it('passes options and applies changed attributes', () => {
			const el = render('<maplair-map center="0,0" zoom="3" max-zoom="12" scroll-wheel-zoom="false" zoom-animation="false"></maplair-map>');
			expect(el.map.getMaxZoom()).to.equal(12);
			expect(el.map.scrollWheelZoom.enabled()).to.be.false;

			el.setAttribute('zoom', '5');
			expect(el.map.getZoom()).to.equal(5);
			el.setAttribute('scroll-wheel-zoom', '');
			expect(el.map.scrollWheelZoom.enabled()).to.be.true;
			el.setAttribute('max-zoom', '4');
			expect(el.map.getMaxZoom()).to.equal(4);
		});

		it('uses a CRS by name', () => {
			const el = render('<maplair-map crs="EPSG4326"></maplair-map>');
			expect(el.map.options.crs.code).to.equal('EPSG:4326');
		});

		it('removes the map when removed, and creates it again when added', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-marker latlng="1,2"></maplair-marker></maplair-map>');
			const map = el.map, marker = el.querySelector('maplair-marker');
			el.remove();
			expect(el.map).to.equal(null);
			expect(marker.layer).to.equal(null);
			expect(el.querySelector('.maplair-map-pane')).to.equal(null);

			container.append(el);
			expect(el.map).to.not.equal(map);
			expect(el.map.hasLayer(marker.layer)).to.be.true;
		});

		it('resolves whenReady() with the map and dispatches maplair-ready', async () => {
			const el = document.createElement('maplair-map'), ready = vi.fn();
			el.addEventListener('maplair-ready', ready);
			container = document.createElement('div');
			container.append(el);
			document.body.append(container);
			expect(await el.whenReady()).to.equal(el.map);
			expect(ready).toHaveBeenCalledOnce();
		});

		it('dispatches the events of the map', () => {
			const el = render('<maplair-map center="0,0" zoom="2"></maplair-map>'), moveend = vi.fn();
			el.addEventListener('maplair-moveend', moveend);
			el.map.setZoom(3, {animate: false});
			expect(moveend).toHaveBeenCalled();
			expect(moveend.mock.calls[0][0].detail.target).to.equal(el.map);
		});

		it('dispatches other events of the map when listened to', () => {
			const el = render('<maplair-map center="0,0" zoom="2"></maplair-map>'), listener = vi.fn();
			el.addEventListener('maplair-custom', listener);
			el.map.fire('custom', {foo: 1});
			expect(listener.mock.calls[0][0].detail.foo).to.equal(1);
		});

		it('reflects the view with reflect-view', () => {
			const el = render('<maplair-map center="0,0" zoom="2" reflect-view></maplair-map>');
			el.map.setView([10, 20], 4, {animate: false});
			expect(el.getAttribute('zoom')).to.equal('4');
			expect(el.getAttribute('center')).to.equal('10.00,20.00');
		});

		it('hides its fallback content once created', () => {
			const el = render('<maplair-map><p>No map</p></maplair-map>');
			expect(getComputedStyle(el.querySelector('p')).display).to.equal('none');
		});
	});

	describe('layers', () => {
		it('adds tile layers and markers', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-tile-layer url="${tiles}" max-zoom="10"></maplair-tile-layer>
				<maplair-marker latlng="1,2" title="Here"></maplair-marker>
			</maplair-map>`);
			const tile = el.querySelector('maplair-tile-layer').layer,
			marker = el.querySelector('maplair-marker').layer;
			expect(tile).to.be.instanceOf(TileLayer);
			expect(tile.options.maxZoom).to.equal(10);
			expect(el.map.hasLayer(tile)).to.be.true;
			expect(marker).to.be.instanceOf(Marker);
			expect(marker.getLatLng()).to.eql(new LatLng(1, 2));
			expect(marker.options.title).to.equal('Here');
		});

		it('adds a tile layer of a provider', () => {
			const el = render('<maplair-map><maplair-tile-layer provider="osm"></maplair-tile-layer></maplair-map>');
			expect(el.querySelector('maplair-tile-layer').layer._url).to.contain('tile.openstreetmap.org');
		});

		it('applies changed attributes with setters', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker latlng="1,2"></maplair-marker>
				<maplair-circle latlng="0,0" radius="1000" color="red"></maplair-circle>
			</maplair-map>`);
			const markerEl = el.querySelector('maplair-marker'), marker = markerEl.layer;
			markerEl.setAttribute('latlng', '3,4');
			expect(markerEl.layer).to.equal(marker);
			expect(marker.getLatLng()).to.eql(new LatLng(3, 4));

			const circleEl = el.querySelector('maplair-circle'), circle = circleEl.layer;
			expect(circle).to.be.instanceOf(Circle);
			circleEl.setAttribute('radius', '2000');
			circleEl.setAttribute('color', 'blue');
			expect(circleEl.layer).to.equal(circle);
			expect(circle.getRadius()).to.equal(2000);
			expect(circle.options.color).to.equal('blue');
		});

		it('recreates a layer for attributes without a setter', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-marker latlng="1,2"></maplair-marker></maplair-map>');
			const markerEl = el.querySelector('maplair-marker'), marker = markerEl.layer;
			markerEl.setAttribute('title', 'New');
			expect(markerEl.layer).to.not.equal(marker);
			expect(markerEl.layer.options.title).to.equal('New');
			expect(el.map.hasLayer(marker)).to.be.false;
			expect(el.map.hasLayer(markerEl.layer)).to.be.true;
		});

		it('removes a layer when its element is removed', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-polyline latlngs="0,0 1,1 2,0"></maplair-polyline></maplair-map>');
			const lineEl = el.querySelector('maplair-polyline'), line = lineEl.layer;
			expect(line.getLatLngs()).to.have.length(3);
			lineEl.remove();
			expect(el.map.hasLayer(line)).to.be.false;
		});

		it('adds layers added later', () => {
			const el = render('<maplair-map center="0,0" zoom="2"></maplair-map>');
			el.insertAdjacentHTML('beforeend', '<maplair-polygon latlngs="0,0 0,10 10,10"></maplair-polygon>');
			const polygon = el.querySelector('maplair-polygon').layer;
			expect(polygon).to.be.instanceOf(Polygon);
			expect(el.map.hasLayer(polygon)).to.be.true;
		});

		it('adds the child layers to groups', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-layer-group><maplair-circle-marker latlng="1,1"></maplair-circle-marker></maplair-layer-group>
			</maplair-map>`);
			const group = el.querySelector('maplair-layer-group').layer,
			cm = el.querySelector('maplair-circle-marker').layer;
			expect(group).to.be.instanceOf(LayerGroup);
			expect(cm).to.be.instanceOf(CircleMarker);
			expect(group.hasLayer(cm)).to.be.true;
			expect(el.map.hasLayer(cm)).to.be.true;
		});

		it('shows and hides a layer with hidden', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-marker latlng="1,2" hidden></maplair-marker></maplair-map>');
			const markerEl = el.querySelector('maplair-marker');
			expect(el.map.hasLayer(markerEl.layer)).to.be.false;
			markerEl.hidden = false;
			expect(el.map.hasLayer(markerEl.layer)).to.be.true;
		});

		it('dispatches the events of layers, bubbling', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-marker latlng="1,2"></maplair-marker></maplair-map>'),
			click = vi.fn();
			el.addEventListener('maplair-click', click);
			const marker = el.querySelector('maplair-marker').layer;
			marker.fire('click', {latlng: marker.getLatLng()}, true);
			expect(click).toHaveBeenCalledOnce();
			expect(click.mock.calls[0][0].target).to.equal(el.querySelector('maplair-marker'));
		});

		it('merges options set in JavaScript', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-geojson></maplair-geojson></maplair-map>');
			const geojsonEl = el.querySelector('maplair-geojson');
			geojsonEl.options = {pointToLayer: (feature, latlng) => new CircleMarker(latlng)};
			geojsonEl.layer.addData({type: 'Point', coordinates: [1, 2]});
			expect(geojsonEl.layer.getLayers()[0]).to.be.instanceOf(CircleMarker);
		});
	});

	describe('<maplair-geojson>', () => {
		const data = {type: 'FeatureCollection', features: [
			{type: 'Feature', properties: {name: 'A <b>', danger: 1}, geometry: {type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 0]]]}},
			{type: 'Feature', properties: {name: 'B', danger: 3}, geometry: {type: 'Polygon', coordinates: [[[0, 0], [-10, 0], [-10, -10], [0, 0]]]}}
		]};

		it('shows inline data with tooltip templates', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-geojson tooltip="{name} ({danger})" color="green">
					<script type="application/geo+json">${JSON.stringify(data)}</script>
				</maplair-geojson>
			</maplair-map>`);
			const layer = el.querySelector('maplair-geojson').layer;
			expect(layer).to.be.instanceOf(GeoJSON);
			const [a, b] = layer.getLayers();
			expect(a.getTooltip().getContent()).to.equal('A &#60;b&#62; (1)');
			expect(b.getTooltip().getContent()).to.equal('B (3)');
			expect(a.options.color).to.equal('green');
		});

		it('styles features by a classification, shown in the legend', async () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-geojson>
					<script type="application/geo+json">${JSON.stringify(data)}</script>
					<maplair-classification property="danger" name="Danger">
						<maplair-class value="1" fill-color="#00ff00" legend="low"></maplair-class>
						<maplair-class lower="2" fill-color="#ff0000" legend="high"></maplair-class>
					</maplair-classification>
				</maplair-geojson>
				<maplair-legend-control></maplair-legend-control>
			</maplair-map>`);
			const [a, b] = el.querySelector('maplair-geojson').layer.getLayers();
			expect(a.options.fillColor).to.equal('#00ff00');
			expect(b.options.fillColor).to.equal('#ff0000');
			await new Promise(requestAnimationFrame);
			const legend = el.querySelector('maplair-legend-control').control.getContainer();
			expect(legend.textContent).to.contain('low');
			expect(legend.textContent).to.contain('high');
		});
	});

	describe('popups and tooltips', () => {
		it('binds a popup with the content of the element, open with open', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker latlng="1,2"><maplair-popup open>Hello <b>world</b></maplair-popup></maplair-marker>
			</maplair-map>`);
			const marker = el.querySelector('maplair-marker').layer,
			popupEl = el.querySelector('maplair-popup');
			expect(marker.getPopup()).to.be.instanceOf(Popup);
			expect(marker.isPopupOpen()).to.be.true;
			expect(marker.getPopup().getElement().textContent).to.contain('Hello world');

			marker.closePopup();
			expect(popupEl.hasAttribute('open')).to.be.false;
			popupEl.setAttribute('open', '');
			expect(marker.isPopupOpen()).to.be.true;
		});

		it('opens a popup of the map at latlng', () => {
			const el = render('<maplair-map center="0,0" zoom="2"><maplair-popup latlng="1,2" open>Hi</maplair-popup></maplair-map>');
			expect(el.querySelector('maplair-popup').popup.isOpen()).to.be.true;
		});

		it('binds a permanent tooltip', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker latlng="1,2"><maplair-tooltip permanent direction="top">Label</maplair-tooltip></maplair-marker>
			</maplair-map>`);
			const tooltip = el.querySelector('maplair-marker').layer.getTooltip();
			expect(tooltip.options.permanent).to.be.true;
			expect(tooltip.options.direction).to.equal('top');
			expect(tooltip.isOpen()).to.be.true;
		});

		it('unbinds a popup when its element is removed', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker latlng="1,2"><maplair-popup>Hi</maplair-popup></maplair-marker>
			</maplair-map>`);
			el.querySelector('maplair-popup').remove();
			expect(el.querySelector('maplair-marker').layer.getPopup()).to.not.be.ok;
		});
	});

	describe('icons', () => {
		it('sets the icon of the marker', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker latlng="1,2"><maplair-div-icon icon-size="20,20"><span class="glyph">★</span></maplair-div-icon></maplair-marker>
			</maplair-map>`);
			const marker = el.querySelector('maplair-marker').layer;
			expect(marker.getElement().querySelector('.glyph').textContent).to.equal('★');
			expect(marker.options.icon.options.iconSize).to.eql([20, 20]);

			el.querySelector('maplair-div-icon').remove();
			expect(marker.getElement().querySelector('.glyph')).to.equal(null);
		});
	});

	describe('controls', () => {
		it('replaces the default zoom control', () => {
			const el = render('<maplair-map><maplair-zoom-control position="topright"></maplair-zoom-control></maplair-map>');
			expect(el.querySelectorAll('.maplair-control-zoom')).to.have.length(1);
			expect(el.querySelector('.maplair-top.maplair-right .maplair-control-zoom')).to.be.ok;
		});

		it('adds a scale control and removes it with its element', () => {
			const el = render('<maplair-map><maplair-scale-control></maplair-scale-control></maplair-map>');
			expect(el.querySelector('.maplair-control-scale')).to.be.ok;
			el.querySelector('maplair-scale-control').remove();
			expect(el.querySelector('.maplair-control-scale')).to.equal(null);
		});

		it('lists the named layers in the layers control', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-tile-layer name="A" base url="${tiles}"></maplair-tile-layer>
				<maplair-tile-layer name="B" base url="${tiles}"></maplair-tile-layer>
				<maplair-marker name="Marker" latlng="1,2"></maplair-marker>
				<maplair-layers-control collapsed="false"></maplair-layers-control>
			</maplair-map>`);
			const [a, b] = Array.from(el.querySelectorAll('maplair-tile-layer'), e => e.layer),
			control = el.querySelector('maplair-layers-control').control;
			expect(control.getLayers().map(l => l.name)).to.eql(['A', 'B', 'Marker']);
			// one base layer at a time
			expect(el.map.hasLayer(a)).to.be.true;
			expect(el.map.hasLayer(b)).to.be.false;

			el.querySelector('maplair-marker').remove();
			expect(control.getLayers().map(l => l.name)).to.eql(['A', 'B']);
		});

		it('shows the content of a text control', () => {
			const el = render('<maplair-map><maplair-text-control position="topright"><h2>Title</h2></maplair-text-control></maplair-map>');
			expect(el.querySelector('.maplair-top.maplair-right h2').textContent).to.equal('Title');
		});

		it('dispatches maplair-click of a button control', () => {
			const el = render('<maplair-map><maplair-button-control title="Go">Go</maplair-button-control></maplair-map>'),
			click = vi.fn();
			el.querySelector('maplair-button-control').addEventListener('maplair-click', click);
			el.querySelector('maplair-button-control').control.getButton().click();
			expect(click).toHaveBeenCalledOnce();
		});
	});

	describe('more layers', () => {
		it('updates the WMS parameters', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-wms-layer url="https://example.com/wms" layers="a" format="image/png" transparent></maplair-wms-layer>
			</maplair-map>`);
			const wmsEl = el.querySelector('maplair-wms-layer'), wms = wmsEl.layer;
			expect(wms).to.be.instanceOf(WMSTileLayer);
			expect(wms.wmsParams.layers).to.equal('a');
			expect(wms.wmsParams.transparent).to.equal(true);
			wmsEl.setAttribute('layers', 'b');
			expect(wmsEl.layer).to.equal(wms);
			expect(wms.wmsParams.layers).to.equal('b');
		});

		it('clusters markers', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-marker-cluster>
					<maplair-marker latlng="1,1"></maplair-marker><maplair-marker latlng="1.01,1.01"></maplair-marker>
				</maplair-marker-cluster>
			</maplair-map>`);
			const cluster = el.querySelector('maplair-marker-cluster').layer;
			expect(cluster).to.be.instanceOf(MarkerClusterGroup);
			expect(cluster.getLayers()).to.have.length(2);
		});

		it('adds heat, image and SVG overlays', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-heat-layer latlngs="1,1 2,2,0.5"></maplair-heat-layer>
				<maplair-image-overlay url="data:image/gif;base64,R0lGODlhAQABAAAAACw=" bounds="0,0 10,10" opacity="0.5"></maplair-image-overlay>
				<maplair-svg-overlay bounds="0,0 10,10"><svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg></maplair-svg-overlay>
			</maplair-map>`);
			expect(el.querySelector('maplair-heat-layer').layer).to.be.instanceOf(HeatLayer);
			expect(el.querySelector('maplair-heat-layer').layer._latlngs).to.have.length(2);
			const image = el.querySelector('maplair-image-overlay').layer;
			expect(image).to.be.instanceOf(ImageOverlay);
			expect(image.options.opacity).to.equal(0.5);
			const svg = el.querySelector('maplair-svg-overlay').layer;
			expect(svg).to.be.instanceOf(SVGOverlay);
			expect(svg.getElement().localName).to.equal('svg');
			expect(el.map.hasLayer(svg)).to.be.true;
		});

		it('dispatches events of feature group members once', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-feature-group><maplair-circle-marker latlng="1,1"></maplair-circle-marker></maplair-feature-group>
			</maplair-map>`), click = vi.fn();
			el.addEventListener('maplair-click', click);
			const cm = el.querySelector('maplair-circle-marker').layer;
			cm.fire('click', {latlng: cm.getLatLng()}, true);
			expect(click).toHaveBeenCalledOnce();
			expect(click.mock.calls[0][0].target).to.equal(el.querySelector('maplair-circle-marker'));
		});
	});

	describe('more controls', () => {
		it('shows the layer of a minimap', () => {
			const el = render(`<maplair-map center="0,0" zoom="5">
				<maplair-minimap-control><maplair-tile-layer url="${tiles}"></maplair-tile-layer></maplair-minimap-control>
			</maplair-map>`);
			const control = el.querySelector('maplair-minimap-control').control;
			expect(control).to.be.ok;
			expect(el.querySelector('.maplair-control-minimap')).to.be.ok;
			// the layer is on the minimap, not on the map
			expect(el.map.hasLayer(el.querySelector('maplair-tile-layer').layer)).to.be.false;
		});

		it('searches the features of a layer element', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-geojson id="huts"><script type="application/geo+json">{"type": "Feature", "properties": {"name": "Hut"}, "geometry": {"type": "Point", "coordinates": [1, 2]}}</script></maplair-geojson>
				<maplair-search-control layers="#huts"></maplair-search-control>
			</maplair-map>`);
			expect(el.querySelector('maplair-search-control').control).to.be.ok;
			expect(el.querySelector('.maplair-control-search')).to.be.ok;
		});

		it('compares layers side by side', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-tile-layer id="left" url="${tiles}"></maplair-tile-layer>
				<maplair-tile-layer id="right" url="${tiles}"></maplair-tile-layer>
				<maplair-side-by-side-control left="#left" right="#right"></maplair-side-by-side-control>
			</maplair-map>`);
			expect(el.querySelector('maplair-side-by-side-control').control).to.be.ok;
			expect(el.querySelector('maplair-tile-layer#right').layer.getContainer().style.clipPath).to.contain('polygon');
		});

		it('steps through the times of its layers', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-time-control times="2026-01-01 2026-01-02">
					<maplair-wms-layer url="https://example.com/wms" layers="a"></maplair-wms-layer>
				</maplair-time-control>
			</maplair-map>`);
			const control = el.querySelector('maplair-time-control').control,
			wms = el.querySelector('maplair-wms-layer').layer;
			expect(control.getTimes()).to.have.length(2);
			expect(el.map.hasLayer(wms)).to.be.true;
			control.next();
			expect(wms.wmsParams.time).to.contain('2026-01-02');
		});

		it('builds a context menu of buttons', () => {
			const el = render(`<maplair-map center="0,0" zoom="2">
				<maplair-context-menu><button>Center here</button><button disabled>Nothing</button></maplair-context-menu>
			</maplair-map>`);
			const menu = el.querySelector('maplair-context-menu').control;
			expect(menu).to.be.ok;
			expect(menu._items.map(i => i.text)).to.eql(['Center here', 'Nothing']);
		});
	});

	describe('map features', () => {
		it('synchronizes maps', async () => {
			const el = render(`<div><maplair-map id="a" center="0,0" zoom="2" zoom-animation="false"></maplair-map>
				<maplair-map sync-with="#a" center="0,0" zoom="2" zoom-animation="false"></maplair-map></div>`);
			const [a, b] = el.querySelectorAll('maplair-map');
			await Promise.resolve();
			a.map.setView([10, 10], 4, {animate: false});
			expect(b.map.getZoom()).to.equal(4);
		});

		it('keeps the view in the hash', () => {
			const hash = location.hash;
			try {
				const el = render('<maplair-map center="10,20" zoom="5" hash></maplair-map>');
				el.map.setView([11, 21], 6, {animate: false});
				expect(location.hash).to.contain('6/11');
			} finally {
				history.replaceState(null, '', location.pathname + location.search + hash);
			}
		});

		it('rotates the map with bearing', () => {
			const el = render('<maplair-map center="0,0" zoom="2" bearing="30"></maplair-map>');
			expect(el.map.getBearing()).to.equal(30);
			el.setAttribute('bearing', '45');
			expect(el.map.getBearing()).to.equal(45);
		});
	});

	describe('form control', () => {
		it('picks a location', () => {
			const el = render('<form><maplair-map name="location" pick required center="0,0" zoom="2"></maplair-map></form>');
			const form = el, map = el.querySelector('maplair-map');
			expect(form.checkValidity()).to.be.false;

			map.map.fire('click', {latlng: new LatLng(1.5, 2.25)});
			expect(map.value).to.equal('1.5,2.25');
			expect(new FormData(form).get('location')).to.equal('1.5,2.25');
			expect(form.checkValidity()).to.be.true;

			form.reset();
			expect(map.value).to.equal('');
		});

		it('starts with the location of value', () => {
			const el = render('<form><maplair-map name="location" pick value="3,4" center="0,0" zoom="2"></maplair-map></form>');
			expect(new FormData(el).get('location')).to.equal('3,4');
		});
	});
});
