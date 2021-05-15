export class TodoEntry {
	constructor(data: Partial<TodoEntry>) {
		this.createdAt = Date.now();
		Object.assign(this, data);
	}
	createdAt: number;
	text: string;
	//order: number;
}