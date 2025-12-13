import Papa from 'papaparse';
import { z } from 'zod';
import type { Book } from '$lib/types';

const StoryGraphRowSchema = z.object({
	Title: z.string(),
	Authors: z.string(),
	'ISBN/UID': z.string(),
	'Read Status': z.string(),
	Format: z.string().optional()
});

type StoryGraphRow = z.infer<typeof StoryGraphRowSchema>;

export async function parseStoryGraphCSV(fileContent: string): Promise<Book[]> {
	return new Promise((resolve, reject) => {
		Papa.parse<StoryGraphRow>(fileContent, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				try {
					const books: Book[] = [];

					for (const row of results.data) {
						const parsed = StoryGraphRowSchema.safeParse(row);

						if (parsed.success && parsed.data['Read Status'] === 'to-read') {
							books.push({
								title: parsed.data.Title.trim(),
								authors: parsed.data.Authors.trim(),
								isbn: parsed.data['ISBN/UID'].trim()
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
				reject(new Error(`CSV parsing error: ${error.message}`));
			}
		});
	});
}
