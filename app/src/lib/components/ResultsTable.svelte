<script lang="ts">
	import BookCard from './BookCard.svelte';
	import { filteredResults, searchState } from '$lib/stores/search';

	const availableCount = $derived(
		$filteredResults.filter((r) => r.libraryMatch?.status === 'AVAILABLE').length
	);
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
			<div class="stat-title">Showing</div>
			<div class="stat-value text-accent">{$filteredResults.length}</div>
		</div>
	</div>

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
