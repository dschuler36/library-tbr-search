import Papa from 'papaparse';
import { z } from 'zod';
import type { Book } from '$lib/types';
import type { CSVParser } from './types';

const GoodreadsRowSchema = z.object({
	Title: z.string(),
	Author: z.string(), // Note: singular, not plural
	ISBN13: z.string().optional(), // ISBN13 is preferred
	ISBN: z.string().optional(), // ISBN as fallback
	'Exclusive Shelf': z.string()
});

type GoodreadsRow = z.infer<typeof GoodreadsRowSchema>;

export class GoodreadsParser implements CSVParser {
	getName(): string {
		return 'Goodreads';
	}

	async parse(fileContent: string): Promise<Book[]> {
		return new Promise((resolve, reject) => {
			Papa.parse<GoodreadsRow>(fileContent, {
				header: true,
				skipEmptyLines: true,
				complete: (results) => {
					try {
						const books: Book[] = [];

						for (const row of results.data) {
							const parsed = GoodreadsRowSchema.safeParse(row);

							if (
								parsed.success &&
								parsed.data['Exclusive Shelf']?.toLowerCase() === 'to-read'
							) {
								// Prefer ISBN13 over ISBN, fallback to empty string
								const isbn = parsed.data.ISBN13?.trim() || parsed.data.ISBN?.trim() || '';

								// Clean up ISBNs that have Goodreads' Excel-style formatting
								// Goodreads sometimes exports ISBNs as ="1234567890"
								const cleanIsbn = isbn
									.replace(/^="/, '') // Remove leading ="
									.replace(/"$/, '') // Remove trailing "
									.replace(/^=/, '') // Remove leading =
									.replace(/"/g, ''); // Remove any remaining quotes

								books.push({
									title: parsed.data.Title.trim().replace(/\s+/g, ' '),
									authors: parsed.data.Author.trim().replace(/\s+/g, ' '), // Map Author to authors and normalize whitespace
									isbn: cleanIsbn,
									source: 'goodreads'
								});
							}
						}

						// Explicitly clear the results data to free memory
						results.data.length = 0;

						resolve(books);
					} catch (error) {
						reject(error);
					}
				},
				error: (error: Error) => {
					reject(new Error(`Goodreads CSV parsing error: ${error.message}`));
				}
			});
		});
	}
}
