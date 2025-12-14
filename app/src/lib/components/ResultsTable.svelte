<script lang="ts">
	import BookCard from './BookCard.svelte';
	import { filteredResults, searchState } from '$lib/stores/search';

	const availableCount = $derived(
		$filteredResults.filter((r) => r.libraryMatch?.status === 'AVAILABLE').length
	);

	const notFoundBooks = $derived(
		$searchState.searchResults.filter((r) => r.libraryMatch === null)
	);

	let showNotFound = $state(false);
</script>

<div class="space-y-4">
	<div class="stats shadow">
		<div class="stat">
			<div class="stat-title">Total Books</div>
			<div class="stat-value text-primary">{$searchState.searchResults.length}</div>
		</div>

		<div class="stat">
			<div class="stat-title">Available</div>
			<div class="stat-value text-success">{availableCount}</div>
		</div>

		<div class="stat">
			<div class="stat-title">Not Found</div>
			<div class="stat-value text-warning">{notFoundBooks.length}</div>
		</div>

		<div class="stat">
			<div class="stat-title">Showing</div>
			<div class="stat-value text-accent">{$filteredResults.length}</div>
		</div>
	</div>

	{#if notFoundBooks.length > 0}
		<div class="collapse collapse-arrow bg-base-200">
			<input type="checkbox" bind:checked={showNotFound} />
			<div class="collapse-title text-lg font-medium">
				📚 Books Not Found in Library ({notFoundBooks.length})
			</div>
			<div class="collapse-content">
				<div class="space-y-2">
					{#each notFoundBooks as result}
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body p-4">
								<div class="flex justify-between items-start">
									<div>
										<h4 class="font-semibold">{result.book.title}</h4>
										<p class="text-sm opacity-70">by {result.book.authors}</p>
										{#if result.book.isbn}
											<p class="text-xs opacity-50 mt-1">ISBN: {result.book.isbn}</p>
										{/if}
									</div>
									{#if result.book.source}
										<div class="badge badge-sm badge-ghost">{result.book.source}</div>
									{/if}
								</div>
								{#if result.error}
									<div class="text-xs text-error mt-2">Error: {result.error}</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if $filteredResults.length === 0}
		<div class="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="stroke-info shrink-0 w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<span>No books match the current filters. Try adjusting your filters.</span>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each $filteredResults as result (result.book.title + result.book.authors)}
				<BookCard {result} />
			{/each}
		</div>
	{/if}
</div>
