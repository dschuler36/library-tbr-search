<script lang="ts">
	import { searchState, availableBranches, availableFormats } from '$lib/stores/search';

	function toggleBranch(branchName: string) {
		searchState.update((s) => {
			const branches = s.filters.branches.includes(branchName)
				? s.filters.branches.filter((b) => b !== branchName)
				: [...s.filters.branches, branchName];

			return {
				...s,
				filters: {
					...s.filters,
					branches
				}
			};
		});
	}

	function toggleFormat(format: string) {
		searchState.update((s) => {
			const formats = s.filters.formats.includes(format)
				? s.filters.formats.filter((f) => f !== format)
				: [...s.filters.formats, format];

			return {
				...s,
				filters: {
					...s.filters,
					formats
				}
			};
		});
	}

	function toggleAvailableOnly() {
		searchState.update((s) => ({
			...s,
			filters: {
				...s.filters,
				showOnlyAvailable: !s.filters.showOnlyAvailable
			}
		}));
	}

	function setSortBy(sortBy: 'availability' | 'title' | 'author') {
		searchState.update((s) => ({
			...s,
			filters: {
				...s.filters,
				sortBy
			}
		}));
	}

	function clearFilters() {
		searchState.update((s) => ({
			...s,
			filters: {
				branches: [],
				formats: [],
				showOnlyAvailable: false,
				sortBy: 'availability'
			}
		}));
	}
</script>

<div class="card bg-base-100 shadow-md mb-6">
	<div class="card-body">
		<div class="flex justify-between items-center mb-4">
			<h3 class="font-semibold text-lg">Filters & Sorting</h3>
			<button class="btn btn-ghost btn-sm" onclick={clearFilters}>Clear All</button>
		</div>

		<div class="grid gap-6 md:grid-cols-4">
			<!-- Sort By -->
			<div class="form-control">
				<label class="label">
					<span class="label-text font-medium">Sort By</span>
				</label>
				<select
					class="select select-bordered"
					value={$searchState.filters.sortBy}
					onchange={(e) => setSortBy(e.currentTarget.value as any)}
				>
					<option value="availability">Availability</option>
					<option value="title">Title</option>
					<option value="author">Author</option>
				</select>
			</div>

			<!-- Availability Filter -->
			<div class="form-control">
				<label class="label">
					<span class="label-text font-medium">Availability</span>
				</label>
				<label class="label cursor-pointer justify-start gap-2">
					<input
						type="checkbox"
						class="toggle toggle-primary"
						checked={$searchState.filters.showOnlyAvailable}
						onchange={toggleAvailableOnly}
					/>
					<span class="label-text">Show only available</span>
				</label>
			</div>

			<!-- Format Filter -->
			<div class="form-control">
				<label class="label">
					<span class="label-text font-medium">Formats</span>
				</label>
				<details class="dropdown">
					<summary class="btn btn-outline btn-sm">
						{#if $searchState.filters.formats.length === 0}
							All Formats
						{:else}
							{$searchState.filters.formats.length} selected
						{/if}
					</summary>
					<div
						class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-64 max-h-96 overflow-y-auto mt-2"
					>
						{#each $availableFormats as format}
							<label class="label cursor-pointer justify-start gap-2 px-4 py-2 hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									checked={$searchState.filters.formats.includes(format)}
									onchange={() => toggleFormat(format)}
								/>
								<span class="label-text">{format}</span>
							</label>
						{/each}
						{#if $availableFormats.length === 0}
							<div class="px-4 py-2 text-sm opacity-70">No formats available</div>
						{/if}
					</div>
				</details>
			</div>

			<!-- Branch Filter -->
			<div class="form-control">
				<label class="label">
					<span class="label-text font-medium">Branches</span>
				</label>
				<details class="dropdown">
					<summary class="btn btn-outline btn-sm">
						{#if $searchState.filters.branches.length === 0}
							All Branches
						{:else}
							{$searchState.filters.branches.length} selected
						{/if}
					</summary>
					<div
						class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-64 max-h-96 overflow-y-auto mt-2"
					>
						{#each $availableBranches as branch}
							<label class="label cursor-pointer justify-start gap-2 px-4 py-2 hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									checked={$searchState.filters.branches.includes(branch)}
									onchange={() => toggleBranch(branch)}
								/>
								<span class="label-text">{branch}</span>
							</label>
						{/each}
						{#if $availableBranches.length === 0}
							<div class="px-4 py-2 text-sm opacity-70">No branches available</div>
						{/if}
					</div>
				</details>
			</div>
		</div>
	</div>
</div>
