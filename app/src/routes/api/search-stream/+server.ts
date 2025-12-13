import { BiblioCommonsClient } from '$lib/server/bibliocommons';
import type { RequestHandler } from './$types';
import type { Book, SearchResult } from '$lib/types';
import { isFormatExcluded } from '$lib/utils/formats';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { books, selectedFormats = [] } = await request.json();

		if (!books || !Array.isArray(books)) {
			return new Response(JSON.stringify({ error: 'Invalid books array' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

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

				console.log(`Starting search for ${books.length} books...`);

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
						// Search for the book
						const searchResults = await client.search(`${book.title} ${book.authors}`, 10);

						if (searchResults.length === 0) {
							console.log(`  ❌ Not found in catalog`);
							results.push({ book, libraryMatch: null });
							continue;
						}

						// Filter by user-selected formats (also excludes DVDs and eBooks)
						const acceptableResults = searchResults.filter((result: any) => {
							const format = result.briefInfo?.format || '';
							return !isFormatExcluded(format, selectedFormats);
						});

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

				const availableCount = results.filter((r) => r.libraryMatch?.status === 'AVAILABLE')
					.length;
				console.log(`\n✅ Search complete! ${availableCount}/${books.length} books available\n`);

				// Send complete event with results
				sendEvent('complete', {
					results,
					processed: books.length,
					total: books.length
				});

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
