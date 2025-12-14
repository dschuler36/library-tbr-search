import type { Book } from '$lib/types';
import { detectCSVFormat } from './parsers/format-detector';
import { StoryGraphParser } from './parsers/storygraph-parser';
import { GoodreadsParser } from './parsers/goodreads-parser';
import { CSVFormat } from './parsers/types';

/**
 * Main entry point for CSV parsing.
 * Auto-detects format and uses appropriate parser.
 */
export async function parseCSV(fileContent: string): Promise<Book[]> {
	// Detect the format
	const detection = await detectCSVFormat(fileContent);

	// Select appropriate parser
	let parser;
	switch (detection.format) {
		case CSVFormat.STORYGRAPH:
			parser = new StoryGraphParser();
			break;
		case CSVFormat.GOODREADS:
			parser = new GoodreadsParser();
			break;
		case CSVFormat.UNKNOWN:
		default:
			throw new Error(
				'Unsupported CSV format. Please upload a Storygraph or Goodreads export file. ' +
					`Found headers: ${detection.headers.join(', ')}`
			);
	}

	// Parse using selected parser
	console.log(`Detected ${parser.getName()} format (confidence: ${detection.confidence})`);
	return parser.parse(fileContent);
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use parseCSV instead
 */
export async function parseStoryGraphCSV(fileContent: string): Promise<Book[]> {
	const parser = new StoryGraphParser();
	return parser.parse(fileContent);
}
