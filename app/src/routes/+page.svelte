<script lang="ts">
	import FileUpload from "$lib/components/FileUpload.svelte";
	import FormatSelection from "$lib/components/FormatSelection.svelte";
	import SearchProgress from "$lib/components/SearchProgress.svelte";
	import FilterPanel from "$lib/components/FilterPanel.svelte";
	import ResultsTable from "$lib/components/ResultsTable.svelte";
	import { searchState } from "$lib/stores/search";

	let searchError = $state<string | null>(null);
	let showFormatSelection = $state<boolean>(false);

	async function handleFileUploaded() {
		// Show format selection after file upload instead of starting search
		showFormatSelection = true;
	}

	async function startSearch() {
		searchError = null;
		showFormatSelection = false; // Hide format selection when search starts

		searchState.update((s) => ({
			...s,
			isSearching: true,
			searchResults: [],
			progress: { current: 0, total: $searchState.uploadedBooks.length },
		}));

		try {
			// Use fetch to POST the books data with selected formats
			const response = await fetch("/api/search-stream", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					books: $searchState.uploadedBooks,
					selectedFormats: $searchState.selectedFormats
				}),
			});

			if (!response.ok) {
				throw new Error("Search failed to start");
			}

			// Read the SSE stream
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("No response stream");
			}

			let buffer = "";

			try {
				while (true) {
					const { done, value } = await reader.read();

					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (!line.trim()) continue;

						const eventMatch = line.match(/^event: (\w+)\n/);
						const dataMatch = line.match(/^data: (.+)$/m);

						if (eventMatch && dataMatch) {
							const event = eventMatch[1];
							const data = JSON.parse(dataMatch[1]);

							if (event === "progress") {
								// Update progress with current book info
								searchState.update((s) => ({
									...s,
									progress: {
										current: data.current,
										total: data.total,
										currentBook: data.book,
									},
								}));
							} else if (event === "complete") {
								// Update with final results
								searchState.update((s) => ({
									...s,
									searchResults: data.results,
									isSearching: false,
								}));
							}
						}
					}
				}
			} finally {
				// Ensure reader is released and buffer is cleared
				reader.releaseLock();
				buffer = "";
			}
		} catch (error) {
			searchError =
				error instanceof Error ? error.message : "Search failed";
			searchState.update((s) => ({
				...s,
				isSearching: false,
			}));
		}
	}

	function reset() {
		searchState.update((s) => ({
			...s,
			uploadedBooks: [],
			searchResults: [],
			isSearching: false,
			progress: { current: 0, total: 0 },
			filters: {
				branches: [],
				formats: [],
				showOnlyAvailable: false,
				sortBy: "availability",
			},
			selectedFormats: ['BK', 'LP_BK'] // Reset to default formats
		}));
		searchError = null;
		showFormatSelection = false;
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-5xl font-bold mb-4">📚 Library TBR Search</h1>
			<p class="text-lg opacity-80">
				Find which books from your TBR are available at
				Cincinnati Public Library.
			</p>
		</div>

		<!-- Main Content -->
		{#if $searchState.uploadedBooks.length === 0 && !$searchState.isSearching && !showFormatSelection}
			<div class="space-y-6">
				<FileUpload onUploaded={handleFileUploaded} />
				
				<!-- Usage Instructions -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title text-xl mb-2">How to get started</h2>
						<div class="prose prose-sm max-w-none">
							<h3 class="text-base font-bold mt-4 mb-2">From Storygraph:</h3>
							<ol class="list-decimal list-inside space-y-2 text-base opacity-80">
								<li>Go to <a href="https://app.thestorygraph.com/user-export" target="_blank" class="link link-primary">app.thestorygraph.com/user-export</a></li>
								<li>Click on <strong>Generate export</strong></li>
								<li>Wait for the download link to become available</li>
								<li>Download the CSV file</li>
								<li>Upload it above!</li>
							</ol>

							<h3 class="text-base font-bold mt-4 mb-2">From Goodreads:</h3>
							<ol class="list-decimal list-inside space-y-2 text-base opacity-80">
								<li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" class="link link-primary">goodreads.com/review/import</a></li>
								<li>Click on <strong>Export Library</strong> at the bottom</li>
								<li>Wait for the email with your export file</li>
								<li>Download the CSV file from the email link</li>
								<li>Upload it above!</li>
							</ol>
						</div>
					</div>
				</div>
			</div>
		{:else if showFormatSelection && !$searchState.isSearching}
			<FormatSelection onStartSearch={startSearch} />
		{:else if $searchState.isSearching}
			<SearchProgress
				current={$searchState.progress.current}
				total={$searchState.progress.total}
				currentBook={$searchState.progress.currentBook}
			/>
		{:else if searchError}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div class="alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{searchError}</span>
					</div>
					<div class="card-actions justify-center gap-4 mt-4">
						<button class="btn btn-primary" onclick={startSearch}
							>Try Again</button
						>
						<button class="btn btn-ghost" onclick={reset}
							>Start Over</button
						>
					</div>
				</div>
			</div>
		{:else if $searchState.searchResults.length > 0}
			<div class="space-y-6">
				<div class="flex justify-between items-center">
					<h2 class="text-2xl font-bold">Search Results</h2>
					<button class="btn btn-ghost" onclick={reset}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
						Start Over
					</button>
				</div>

				<FilterPanel />
				<ResultsTable />
			</div>
		{/if}
	</div>
</div>
