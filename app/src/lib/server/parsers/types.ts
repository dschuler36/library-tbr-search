import type { Book } from '$lib/types';

// Enum for supported CSV formats
export enum CSVFormat {
	STORYGRAPH = 'storygraph',
	GOODREADS = 'goodreads',
	UNKNOWN = 'unknown'
}

// Interface that all parsers must implement
export interface CSVParser {
	parse(fileContent: string): Promise<Book[]>;
	getName(): string;
}

// Format detection result
export interface FormatDetectionResult {
	format: CSVFormat;
	confidence: number; // 0-1 scale
	headers: string[];
}
