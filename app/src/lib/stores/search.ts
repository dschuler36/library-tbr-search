import { writable, derived } from 'svelte/store';
import type { SearchState, SearchResult } from '$lib/types';

export const searchState = writable<SearchState>({
	uploadedBooks: [],
	searchResults: [],
	isSearching: false,
	progress: { current: 0, total: 0 },
	filters: {
		branches: [],
		formats: [],
		showOnlyAvailable: false,
		sortBy: 'availability'
	},
	selectedFormats: ['BK', 'LP_BK'] // Default: Books and Large Print
});

// Derived store for filtered and sorted results
export const filteredResults = derived(searchState, ($state) => {
	let results = [...$state.searchResults];

	// Filter by availability
	if ($state.filters.showOnlyAvailable) {
		results = results.filter(
			(result) => result.libraryMatch && result.libraryMatch.status === 'AVAILABLE'
		);
	}

	// Filter by branches
	if ($state.filters.branches.length > 0) {
		results = results.filter((result) => {
			if (!result.libraryMatch) return false;
			return result.libraryMatch.branches.some((branch) =>
				$state.filters.branches.includes(branch.name)
			);
		});
	}

	// Filter by formats
	if ($state.filters.formats.length > 0) {
		results = results.filter((result) => {
			if (!result.libraryMatch) return false;
			return $state.filters.formats.includes(result.libraryMatch.format);
		});
	}

	// Sort results
	results.sort((a, b) => {
		const sortBy = $state.filters.sortBy;

		if (sortBy === 'availability') {
			const aAvailable = a.libraryMatch?.status === 'AVAILABLE' ? 1 : 0;
			const bAvailable = b.libraryMatch?.status === 'AVAILABLE' ? 1 : 0;
			return bAvailable - aAvailable; // Available first
		} else if (sortBy === 'title') {
			return a.book.title.localeCompare(b.book.title);
		} else if (sortBy === 'author') {
			return a.book.authors.localeCompare(b.book.authors);
		}

		return 0;
	});

	return results;
});

// Derived store for unique branch names from results
export const availableBranches = derived(searchState, ($state) => {
	const branchSet = new Set<string>();

	for (const result of $state.searchResults) {
		if (result.libraryMatch) {
			for (const branch of result.libraryMatch.branches) {
				branchSet.add(branch.name);
			}
		}
	}

	return Array.from(branchSet).sort();
});

// Derived store for unique formats from results
export const availableFormats = derived(searchState, ($state) => {
	const formatSet = new Set<string>();

	for (const result of $state.searchResults) {
		if (result.libraryMatch) {
			formatSet.add(result.libraryMatch.format);
		}
	}

	return Array.from(formatSet).sort();
});
