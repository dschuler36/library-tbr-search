import { RateLimiter } from './rate-limiter';
import type { LibraryMatch, BranchAvailability } from '$lib/types';

export class BiblioCommonsClient {
	private baseUrl = 'https://gateway.bibliocommons.com/v2/libraries/cincinnatilibrary';
	// Configurable rate limit (default 300ms). Can override with RATE_LIMIT_MS env var
	private rateLimiter = new RateLimiter(
		parseInt(process.env.RATE_LIMIT_MS || '300')
	);

	private headers = {
		Accept: 'application/json',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	};

	private async makeRequest(url: string): Promise<any> {
		const response = await fetch(url, { headers: this.headers });

		if (!response.ok) {
			throw new Error(`BiblioCommons API error: ${response.status}`);
		}

		return response.json();
	}

	async search(query: string, limit = 5): Promise<any[]> {
		await this.rateLimiter.wait();

		const params = new URLSearchParams({
			query,
			searchType: 'keyword',
			limit: String(limit)
		});

		const data = await this.makeRequest(`${this.baseUrl}/bibs/search?${params}`);

		// Extract bibliographic records
		const bibs = data.entities?.bibs || {};
		return Object.values(bibs);
	}

	async getAvailability(bibId: string): Promise<LibraryMatch | null> {
		await this.rateLimiter.wait();

		const data = await this.makeRequest(`${this.baseUrl}/bibs/${bibId}/availability`);

		return this.parseAvailability(data, bibId);
	}

	private parseAvailability(data: any, bibId: string): LibraryMatch | null {
		const availabilities = data.entities?.availabilities || {};
		const bibItems = data.entities?.bibItems || {};

		if (!availabilities[bibId]) {
			return null;
		}

		const avail = availabilities[bibId];

		// Extract branch information for available items
		const branchesArray: BranchAvailability[] = [];
		const seenBranches = new Set<string>();

		for (const itemId in bibItems) {
			const item = bibItems[itemId];
			const branchName = item.branchName || 'Unknown';
			const itemStatus = item.availability?.status || 'UNKNOWN';

			// Only include available copies
			if (itemStatus === 'AVAILABLE' && !seenBranches.has(branchName)) {
				branchesArray.push({
					name: branchName,
					collection: item.collection || '',
					callNumber: item.callNumber || '',
					status: itemStatus
				});
				seenBranches.add(branchName);
			}
		}

		return {
			bibId,
			title: avail.metadataId || '',
			author: '', // Not available in this response
			format: '', // Will get from search results
			totalCopies: avail.totalCopies || 0,
			availableCopies: avail.availableCopies || 0,
			status: avail.status || 'UNKNOWN',
			branches: branchesArray,
			catalogUrl: `https://cincinnatilibrary.bibliocommons.com/v2/record/${bibId}`
		};
	}
}
