import {GenerateUUID} from "mobx-graphlink";

export class TodoEntry {
	constructor(data: Partial<TodoEntry>) {
		this.id = GenerateUUID();
		this.createdAt = Date.now();
		Object.assign(this, data);
	}
	id: string;
	createdAt: number;
	text: string;
	//order: number;
}