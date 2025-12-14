import Papa from 'papaparse';
import { CSVFormat, type FormatDetectionResult } from './types';

// Required headers for each format
const STORYGRAPH_REQUIRED_HEADERS = ['Title', 'Authors', 'ISBN/UID', 'Read Status'];
const GOODREADS_REQUIRED_HEADERS = ['Title', 'Author', 'ISBN13', 'Exclusive Shelf'];

// Optional but indicative headers
const STORYGRAPH_INDICATOR_HEADERS = ['Contributors', 'Moods', 'Pace'];
const GOODREADS_INDICATOR_HEADERS = ['Book Id', 'My Rating', 'Bookshelves', 'BCID'];

export function detectCSVFormat(fileContent: string): Promise<FormatDetectionResult> {
	return new Promise((resolve, reject) => {
		// Parse just the first few rows to get headers
		Papa.parse(fileContent, {
			header: true,
			preview: 1, // Only parse first row for headers
			complete: (results) => {
				const headers = results.meta.fields || [];

				// Check for Storygraph format
				const hasStorygraphRequired = STORYGRAPH_REQUIRED_HEADERS.every((h) =>
					headers.includes(h)
				);
				const storygraphIndicatorCount = STORYGRAPH_INDICATOR_HEADERS.filter((h) =>
					headers.includes(h)
				).length;

				// Check for Goodreads format
				const hasGoodreadsRequired = GOODREADS_REQUIRED_HEADERS.every((h) =>
					headers.includes(h)
				);
				const goodreadsIndicatorCount = GOODREADS_INDICATOR_HEADERS.filter((h) =>
					headers.includes(h)
				).length;

				// Determine format with confidence score
				if (hasStorygraphRequired) {
					resolve({
						format: CSVFormat.STORYGRAPH,
						confidence: 0.7 + storygraphIndicatorCount * 0.1,
						headers
					});
				} else if (hasGoodreadsRequired) {
					resolve({
						format: CSVFormat.GOODREADS,
						confidence: 0.7 + goodreadsIndicatorCount * 0.075,
						headers
					});
				} else {
					resolve({
						format: CSVFormat.UNKNOWN,
						confidence: 0,
						headers
					});
				}
			},
			error: (error: Error) => {
				reject(new Error(`Format detection failed: ${error.message}`));
			}
		});
	});
}
