export class RateLimiter {
	private lastRequestTime = 0;

	constructor(private delayMs: number) {}

	async wait() {
		const now = Date.now();
		const timeSinceLastRequest = now - this.lastRequestTime;

		if (timeSinceLastRequest < this.delayMs) {
			const waitTime = this.delayMs - timeSinceLastRequest;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}

		this.lastRequestTime = Date.now();
	}
}
