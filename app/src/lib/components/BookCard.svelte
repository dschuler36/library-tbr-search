<script lang="ts">
	import type { SearchResult } from '$lib/types';

	let { result }: { result: SearchResult } = $props();

	const statusBadgeClass = $derived(
		result.libraryMatch?.status === 'AVAILABLE'
			? 'badge-success'
			: result.libraryMatch?.status === 'CHECKED_OUT'
				? 'badge-warning'
				: 'badge-error'
	);

	const statusText = $derived(
		result.libraryMatch?.status === 'AVAILABLE'
			? 'Available'
			: result.libraryMatch?.status === 'CHECKED_OUT'
				? 'Checked Out'
				: 'Unavailable'
	);
</script>

<div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
	<div class="card-body">
		<div class="flex gap-4">
			{#if result.libraryMatch?.coverImageUrl}
				<div class="flex-shrink-0">
					<img
						src={result.libraryMatch.coverImageUrl}
						alt="Cover of {result.book.title}"
						class="w-24 h-32 object-cover rounded-lg shadow-sm"
						loading="lazy"
					/>
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<div class="flex justify-between items-start gap-4 mb-3">
					<div class="flex-1">
						<h3 class="card-title text-lg">{result.book.title}</h3>
						<p class="text-sm opacity-70">by {result.book.authors}</p>
					</div>

					{#if result.libraryMatch}
						<div class="badge {statusBadgeClass} badge-lg">{statusText}</div>
					{:else}
						<div class="badge badge-ghost">Not Found</div>
					{/if}
				</div>

				{#if result.libraryMatch}
					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm">
							<span class="font-medium">Format:</span>
							<span>{result.libraryMatch.format}</span>
						</div>

						<div class="flex items-center gap-2 text-sm">
							<span class="font-medium">Copies:</span>
							<span>{result.libraryMatch.availableCopies} of {result.libraryMatch.totalCopies} available</span>
						</div>

						{#if result.libraryMatch.branches.length > 0}
							<div class="mt-3">
								<p class="text-sm font-medium mb-2">Available at:</p>
								<div class="space-y-1">
									{#each result.libraryMatch.branches.slice(0, 5) as branch}
										<div class="text-sm pl-3">
											<span class="font-medium">{branch.name}</span>
											<span class="opacity-70">
												{#if branch.collection}
													· {branch.collection}
												{/if}
												{#if branch.callNumber}
													· {branch.callNumber}
												{/if}
											</span>
										</div>
									{/each}
									{#if result.libraryMatch.branches.length > 5}
										<p class="text-sm opacity-70 pl-3">
											+{result.libraryMatch.branches.length - 5} more locations
										</p>
									{/if}
								</div>
							</div>
						{/if}

						<div class="card-actions justify-end mt-4">
							<a
								href={result.libraryMatch.catalogUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-primary btn-sm"
							>
								View in Catalog
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</a>
						</div>
					</div>
				{:else if result.error}
					<div class="alert alert-error">
						<span class="text-sm">{result.error}</span>
					</div>
				{:else}
					<p class="text-sm opacity-70">This book was not found in the library catalog.</p>
				{/if}
			</div>
		</div>
	</div>
</div>
