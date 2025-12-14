import { BiblioCommonsClient } from '$lib/server/bibliocommons';
import type { RequestHandler } from './$types';
import type { Book, SearchResult } from '$lib/types';
import { isFormatExcluded } from '$lib/utils/formats';

// Helper function to check if authors match (fuzzy matching)
function authorsMatch(searchAuthor: string, resultAuthors: string[]): boolean {
	if (!searchAuthor || !resultAuthors || resultAuthors.length === 0) {
		return false;
	}

	// Normalize: lowercase, remove extra spaces, remove common suffixes
	const normalizeAuthor = (author: string) => {
		return author
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim()
			.replace(/\s+(jr\.?|sr\.?|iii?|iv)$/i, ''); // Remove suffixes like Jr., Sr., III
	};

	// Convert "Last, First" to "First Last" format
	const standardizeNameFormat = (author: string) => {
		const normalized = normalizeAuthor(author);
		// Check if it's in "Last, First" format
		if (normalized.includes(',')) {
			const parts = normalized.split(',').map(p => p.trim());
			if (parts.length === 2) {
				return `${parts[1]} ${parts[0]}`; // Convert to "First Last"
			}
		}
		return normalized;
	};

	const searchStandardized = standardizeNameFormat(searchAuthor);

	// Check if any result author matches
	return resultAuthors.some(resultAuthor => {
		const resultStandardized = standardizeNameFormat(resultAuthor);

		// Exact match after standardization
		if (searchStandardized === resultStandardized) return true;

		// Last name match (e.g., "Williams" matches "John Williams")
		const searchLastName = searchStandardized.split(' ').pop() || '';
		const resultLastName = resultStandardized.split(' ').pop() || '';
		if (searchLastName && resultLastName && searchLastName === resultLastName && searchLastName.length > 3) {
			return true;
		}

		return false;
	});
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		let { books, selectedFormats = [] } = await request.json();

		if (!books || !Array.isArray(books)) {
			return new Response(JSON.stringify({ error: 'Invalid books array' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Store book count before processing
		const bookCount = books.length;

		// Create a ReadableStream for Server-Sent Events
		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();

				function sendEvent(event: string, data: any) {
					const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
					controller.enqueue(encoder.encode(message));
				}

				const client = new BiblioCommonsClient();
				const results: SearchResult[] = [];

				console.log(`Starting search for ${bookCount} books...`);

				for (let i = 0; i < books.length; i++) {
					const book: Book = books[i];
					console.log(`[${i + 1}/${books.length}] Searching: ${book.title} by ${book.authors}`);

					// Send progress update
					sendEvent('progress', {
						current: i + 1,
						total: books.length,
						book: book.title
					});

					try {
						let searchResults = [];
						let usedIsbn = false;

						// Try ISBN search first if available (more accurate)
						if (book.isbn && book.isbn.trim().length > 0) {
							console.log(`  📖 Trying ISBN: ${book.isbn}`);
							searchResults = await client.search(book.isbn, 5);
							if (searchResults.length > 0) {
								usedIsbn = true;
							}
						}

						// If ISBN search failed or no ISBN, fall back to title + author
						if (searchResults.length === 0) {
							console.log(`  🔍 Trying title + author search`);
							searchResults = await client.search(`${book.title} ${book.authors}`, 10);
						}

						if (searchResults.length === 0) {
							console.log(`  ❌ Not found in catalog`);
							results.push({ book, libraryMatch: null });
							continue;
						}

						// Filter by user-selected formats (also excludes DVDs and eBooks)
						let acceptableResults = searchResults.filter((result: any) => {
							const format = result.briefInfo?.format || '';
							return !isFormatExcluded(format, selectedFormats);
						});

						// If we used title + author search (not ISBN), validate author matches
						if (!usedIsbn && acceptableResults.length > 0) {
							const authorValidatedResults = acceptableResults.filter((result: any) => {
								const resultAuthors = result.briefInfo?.authors || [];
								const matches = authorsMatch(book.authors, resultAuthors);
								if (!matches) {
									console.log(`  ⚠️ Skipping "${result.briefInfo?.title}" by ${resultAuthors.join(', ')} (author mismatch)`);
								}
								return matches;
							});

							if (authorValidatedResults.length > 0) {
								acceptableResults = authorValidatedResults;
							} else {
								console.log(`  ⚠️ No results matched the author "${book.authors}"`);
							}
						}

						// If no acceptable results, skip this book
						if (acceptableResults.length === 0) {
							console.log(`  ❌ No matching format found (filtered out)`);
							results.push({ book, libraryMatch: null });
							continue;
						}

						const topResult = acceptableResults[0];
						const bibId = topResult.id;
						const briefInfo = topResult.briefInfo || {};

						// Get availability details
						const availability = await client.getAvailability(bibId);

						if (availability) {
							const isAvailable = availability.status === 'AVAILABLE';
							console.log(
								`  ${isAvailable ? '✅' : '⏳'} ${availability.status} - ${availability.availableCopies}/${availability.totalCopies} copies`
							);

							// Extract cover image URL
							const coverImageUrl = briefInfo.jacket?.medium || briefInfo.jacket?.large || briefInfo.jacket?.small;

							results.push({
								book,
								libraryMatch: {
									bibId,
									title: briefInfo.title || book.title,
									author: briefInfo.authors?.[0] || book.authors,
									format: briefInfo.format || 'Unknown',
									totalCopies: availability.totalCopies,
									availableCopies: availability.availableCopies,
									status: availability.status,
									branches: availability.branches,
									catalogUrl: availability.catalogUrl,
									coverImageUrl
								}
							});
						} else {
							console.log(`  ❌ No availability data`);
							results.push({ book, libraryMatch: null });
						}
					} catch (error) {
						console.error(`  ⚠️ Error:`, error instanceof Error ? error.message : error);
						results.push({
							book,
							libraryMatch: null,
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				}

				// Clear books array to free memory
				books.length = 0;

				const availableCount = results.filter((r) => r.libraryMatch?.status === 'AVAILABLE')
					.length;
				console.log(`\n✅ Search complete! ${availableCount}/${bookCount} books available\n`);

				// Send complete event with results
				sendEvent('complete', {
					results,
					processed: bookCount,
					total: bookCount
				});

				// Clear results to free memory
				results.length = 0;

				controller.close();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Search error:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to search library'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
