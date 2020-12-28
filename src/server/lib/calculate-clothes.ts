const clothesIdentifiers = Object.freeze({
	'cap': 'Cap',
	'hat': 'Hap',
	'shoe-covers': 'Shoe covers',
	'winter-gloves': 'Winter gloves',
	'jacket': 'Jacket',
	'thick-long-sleeved-jersey': 'Thick long sleeved jersey',
	'long-sleeve-base-layer': 'Long sleeve base layer',
	'bib-tights': 'Bib tights',
	'bib-shorts-leg-warmers': 'Bib shorts + leg warmers',
	'thin-long-sleeved-jersey': 'Thin long sleeved jersey',
	'mid-weight-gloves': 'Mid weight gloves',
	'bib-shorts': 'Bib shorts',
	'thick-short-sleeved-jersey': 'Thick short sleeved jersey',
	'thin-short-sleeved-jersey': 'Thin short sleeved jersey',
	'short-sleeved-base-layer': 'Short sleeve base layer'
});

interface Temperatures {
	from: number;
	to: number;
}

interface ClothesTemperatureRange {
	temperatures: Temperatures;
	clothesIDs: Array<keyof typeof clothesIdentifiers>;
};

const clothesMapping: ClothesTemperatureRange[] = [{
	temperatures: {
		from: 17,
		to: Infinity
	},
	clothesIDs: [
		"bib-shorts",
		"thin-short-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 15,
		to: 16
	},
	clothesIDs: [
		"bib-shorts",
		"thick-short-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 13,
		to: 14
	},
	clothesIDs: [
		"bib-shorts",
		"thin-long-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 10,
		to: 12
	},
	clothesIDs: [
		"short-sleeved-base-layer",
		"bib-shorts",
		"thin-long-sleeved-jersey",
		"mid-weight-gloves"
	]
}, {
	temperatures: {
		from: 8,
		to: 9
	},
	clothesIDs: [
		"short-sleeved-base-layer",
		"bib-shorts-leg-warmers",
		"thick-long-sleeved-jersey",
		"mid-weight-gloves"
	]
}, {
	temperatures: {
		from: 6,
		to: 7
	},
	clothesIDs: [
		"long-sleeve-base-layer",
		"bib-tights",
		"thick-long-sleeved-jersey",
		"winter-gloves"
	]
}, {
	temperatures: {
		from: 4,
		to: 5
	},
	clothesIDs: [
		"long-sleeve-base-layer",
		"bib-tights",
		"thick-long-sleeved-jersey",
		"winter-gloves",
		"cap"
	]
}, {
	temperatures: {
		from: -Infinity,
		to: 3
	},
	clothesIDs: [
		"long-sleeve-base-layer",
		"bib-tights",
		"thick-long-sleeved-jersey",
		"jacket",
		"winter-gloves",
		"shoe-covers",
		"hat"
	]
}];


function calculateClothes(currentTemperature: number) {
	currentTemperature = Math.round(currentTemperature);

	const {
		clothesIDs,
		temperatures
	}: any = clothesMapping.find(({temperatures}) => {
		const isInRange =
			currentTemperature >= temperatures.from 
			&& currentTemperature <= temperatures.to;
		
		return isInRange;
	});
	
	const individualItems = clothesIDs.map((clothesID: any) => {
		return [clothesID, (clothesIdentifiers as any)[clothesID]]
	});

	return {
		individualItems,
		mainImage: `outfit-${temperatures.from}-${temperatures.to}.webp`
	}
}

export default calculateClothes;