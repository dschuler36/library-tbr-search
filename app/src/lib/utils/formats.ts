// Format codes from BiblioCommons and their human-readable names
export const FORMAT_DISPLAY_NAMES: Record<string, string> = {
	'BK': 'Book',
	'BOOK': 'Book',
	'LP_BK': 'Large Print',
	'LARGE_PRINT': 'Large Print',
	'AB': 'Audiobook (CD)',
	'AUDIOBOOK': 'Audiobook (CD)',
	'EAUDIOBOOK': 'eAudiobook',
	'EBOOK': 'eBook',
	'GRAPHIC_NOVEL': 'Graphic Novel',
	'DVD': 'DVD',
	'BLU-RAY': 'Blu-ray',
	'CD': 'Music CD',
	'MAGAZINE': 'Magazine',
	'KIT': 'Kit'
};

// Formats available for user selection
export interface FormatOption {
	code: string;
	displayName: string;
	description: string;
	icon: string;
}

export const SELECTABLE_FORMATS: FormatOption[] = [
	{
		code: 'BK',
		displayName: 'Book',
		description: 'Standard print books',
		icon: '📖'
	},
	{
		code: 'LP_BK',
		displayName: 'Large Print',
		description: 'Large print books',
		icon: '🔍'
	},
	{
		code: 'AB',
		displayName: 'Audiobook (CD)',
		description: 'Physical audiobook CDs',
		icon: '💿'
	},
	{
		code: 'EAUDIOBOOK',
		displayName: 'eAudiobook',
		description: 'Digital audiobooks',
		icon: '🎧'
	},
	{
		code: 'EBOOK',
		displayName: 'eBook',
		description: 'Digital books',
		icon: '📱'
	},
	{
		code: 'DVD',
		displayName: 'DVD',
		description: 'Video DVDs',
		icon: '📀'
	},
	{
		code: 'GRAPHIC_NOVEL',
		displayName: 'Graphic Novel',
		description: 'Comic books and graphic novels',
		icon: '💭'
	}
];

// Get human-readable name for a format code
export function getFormatDisplayName(format: string): string {
	const upperFormat = format.toUpperCase();
	return FORMAT_DISPLAY_NAMES[upperFormat] || format;
}

// Check if a format should be excluded based on user selection
export function isFormatExcluded(format: string, selectedFormats: string[]): boolean {
	const upperFormat = format.toUpperCase();

	// If no formats selected, exclude everything
	if (selectedFormats.length === 0) {
		return true;
	}

	// Check if this format matches any selected format
	return !selectedFormats.some(selected => {
		const upperSelected = selected.toUpperCase();
		return upperFormat.includes(upperSelected) || upperSelected.includes(upperFormat);
	});
}
