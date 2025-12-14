<script lang="ts">
	let { current, total, currentBook }: { current: number; total: number; currentBook?: string } = $props();

	const percentage = $derived(total > 0 ? Math.round((current / total) * 100) : 0);
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Searching Library Catalog</h2>
		<p class="text-sm opacity-70">Checking availability for your books...</p>

		<div class="mt-6">
			<div class="flex justify-between mb-2">
				<span class="text-sm font-medium">Progress</span>
				<span class="text-sm font-medium">{current} / {total} books</span>
			</div>
			<progress class="progress progress-primary w-full" value={percentage} max="100"></progress>
			<p class="text-center mt-2 text-sm opacity-70">{percentage}% complete</p>
		</div>

		{#if currentBook}
			<div class="mt-4 p-3 bg-base-200 rounded-lg">
				<p class="text-sm font-medium mb-1">Currently searching:</p>
				<p class="text-sm opacity-80">{currentBook}</p>
			</div>
		{/if}

		<div class="flex items-center gap-2 mt-4">
			<span class="loading loading-spinner loading-sm"></span>
			<span class="text-sm">Searching... This may take a few minutes due to rate limiting.</span>
		</div>
	</div>
</div>
