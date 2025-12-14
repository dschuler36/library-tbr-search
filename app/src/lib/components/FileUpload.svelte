<script lang="ts">
	import { searchState } from '$lib/stores/search';

	let { onUploaded }: { onUploaded: () => void } = $props();

	let uploading = $state(false);
	let error = $state<string | null>(null);
	let dragActive = $state(false);
	let fileInputElement: HTMLInputElement;

	async function handleFile(file: File) {
		error = null;
		uploading = true;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Upload failed');
			}

			const { books, total } = await response.json();

			searchState.update((s) => ({
				...s,
				uploadedBooks: books,
				searchResults: [],
				progress: { current: 0, total }
			}));

			onUploaded();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			handleFile(target.files[0]);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;

		if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
			handleFile(event.dataTransfer.files[0]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Upload Your TBR List</h2>
		<p class="text-sm opacity-70">Upload a Storygraph or Goodreads CSV export to find books at your local library</p>

		<button
			type="button"
			class="border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer w-full {dragActive
				? 'border-primary bg-primary/20 scale-105'
				: 'border-base-300 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]'}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			onclick={() => !uploading && fileInputElement.click()}
			disabled={uploading}
		>
			{#if uploading}
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">Processing your file...</p>
			{:else}
				<svg
					class="mx-auto h-16 w-16 text-primary mb-4"
					stroke="currentColor"
					fill="none"
					viewBox="0 0 48 48"
					aria-hidden="true"
				>
					<path
						d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<div class="text-lg font-semibold mb-2">Click to upload or drag and drop</div>
				<p class="text-sm opacity-70">Storygraph or Goodreads CSV export files only</p>
			{/if}
		</button>

		{#if error}
			<div class="alert alert-error mt-4">
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
				<span>{error}</span>
			</div>
		{/if}

		<input
			type="file"
			accept=".csv"
			bind:this={fileInputElement}
			onchange={handleFileSelect}
			class="hidden"
		/>
	</div>
</div>
