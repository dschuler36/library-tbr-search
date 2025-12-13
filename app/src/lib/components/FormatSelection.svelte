<script lang="ts">
	import { SELECTABLE_FORMATS } from '$lib/utils/formats';
	import { searchState } from '$lib/stores/search';

	let { onStartSearch }: { onStartSearch: () => void } = $props();

	function toggleFormat(formatCode: string) {
		searchState.update((s) => {
			const formats = s.selectedFormats.includes(formatCode)
				? s.selectedFormats.filter((f) => f !== formatCode)
				: [...s.selectedFormats, formatCode];

			return { ...s, selectedFormats: formats };
		});
	}

	function selectAll() {
		searchState.update((s) => ({
			...s,
			selectedFormats: SELECTABLE_FORMATS.map((f) => f.code)
		}));
	}

	function selectNone() {
		searchState.update((s) => ({
			...s,
			selectedFormats: []
		}));
	}

	const canStart = $derived($searchState.selectedFormats.length > 0);
	const bookCount = $derived($searchState.uploadedBooks.length);
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header Section -->
	<div class="text-center space-y-2">
		<h2 class="text-3xl font-bold">Choose Your Formats</h2>
		<p class="text-lg opacity-70">
			Select which formats you'd like to search for from your {bookCount} book{bookCount === 1 ? '' : 's'}
		</p>
	</div>

	<!-- Format Grid -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body p-6 md:p-8">
			<!-- Quick Actions -->
			<div class="flex justify-between items-center mb-4">
				<div class="text-sm opacity-70">
					{$searchState.selectedFormats.length} of {SELECTABLE_FORMATS.length} formats selected
				</div>
				<div class="flex gap-2">
					<button class="btn btn-xs btn-ghost" onclick={selectAll}>Select All</button>
					<button class="btn btn-xs btn-ghost" onclick={selectNone}>Clear</button>
				</div>
			</div>

			<!-- Format Options Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each SELECTABLE_FORMATS as format}
					<button
						type="button"
						onclick={() => toggleFormat(format.code)}
						class="group relative p-5 rounded-xl border-2 transition-all duration-200 text-left
							{$searchState.selectedFormats.includes(format.code)
								? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
								: 'border-base-300 hover:border-primary/50 hover:shadow'}"
					>
						<!-- Checkmark Indicator -->
						<div class="absolute top-3 right-3">
							{#if $searchState.selectedFormats.includes(format.code)}
								<div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4 text-primary-content"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
							{:else}
								<div class="w-6 h-6 rounded-full border-2 border-base-300 group-hover:border-primary/50"></div>
							{/if}
						</div>

						<!-- Format Content -->
						<div class="pr-8">
							<div class="text-3xl mb-2">{format.icon}</div>
							<div class="font-bold text-lg mb-1">{format.displayName}</div>
							<div class="text-sm opacity-70">{format.description}</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="card bg-base-200 border-2 border-base-300">
		<div class="card-body p-6">
			<div class="flex flex-col md:flex-row items-center gap-6">
				<div class="flex-1 text-center md:text-left">
					{#if canStart}
						<h3 class="text-xl font-bold mb-1">Ready to search!</h3>
						<p class="opacity-70">
							We'll search for {bookCount} book{bookCount === 1 ? '' : 's'} across {$searchState.selectedFormats.length} format{$searchState.selectedFormats.length === 1 ? '' : 's'}
						</p>
					{:else}
						<h3 class="text-xl font-bold mb-1">Select at least one format</h3>
						<p class="opacity-70">Choose the formats you'd like to search for</p>
					{/if}
				</div>
				<button
					class="px-8 py-4 rounded-lg text-lg font-semibold gap-2 min-w-[200px] shadow-lg transition-all flex items-center justify-center
						bg-primary text-primary-content hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
						{canStart ? 'animate-pulse' : ''}"
					disabled={!canStart}
					onclick={onStartSearch}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					Start Search
				</button>
			</div>
		</div>
	</div>
</div>
