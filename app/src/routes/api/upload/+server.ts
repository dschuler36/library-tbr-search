import { json } from '@sveltejs/kit';
import { parseStoryGraphCSV } from '$lib/server/csv-parser';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Check file type
		if (!file.name.endsWith('.csv')) {
			return json({ error: 'File must be a CSV' }, { status: 400 });
		}

		// Read file content
		const fileContent = await file.text();

		// Parse CSV
		const books = await parseStoryGraphCSV(fileContent);

		return json({
			books,
			total: books.length
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to process file'
			},
			{ status: 500 }
		);
	}
};
