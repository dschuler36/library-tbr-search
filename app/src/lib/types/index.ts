export interface Book {
	title: string;
	authors: string;
	isbn: string;
}

export interface BranchAvailability {
	name: string;
	collection: string;
	callNumber: string;
	status: string;
}

export interface LibraryMatch {
	bibId: string;
	title: string;
	author: string;
	format: string;
	totalCopies: number;
	availableCopies: number;
	status: 'AVAILABLE' | 'UNAVAILABLE' | 'CHECKED_OUT';
	branches: BranchAvailability[];
	catalogUrl: string;
	coverImageUrl?: string;
}

export interface SearchResult {
	book: Book;
	libraryMatch: LibraryMatch | null;
	error?: string;
}

export interface SearchFilters {
	branches: string[];
	formats: string[];
	showOnlyAvailable: boolean;
	sortBy: 'availability' | 'title' | 'author';
}

export interface SearchState {
	uploadedBooks: Book[];
	searchResults: SearchResult[];
	isSearching: boolean;
	progress: { current: number; total: number; currentBook?: string };
	filters: SearchFilters;
}
