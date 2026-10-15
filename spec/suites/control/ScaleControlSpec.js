import {MaplairMap, ScaleControl} from 'maplair';

describe('ScaleControl', () => {
	it('can be added to an unloaded map', () => {
		const map = new MaplairMap(document.createElement('div'));
		new ScaleControl().addTo(map);
	});
});
