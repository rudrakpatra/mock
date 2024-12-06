import * as Comlink from 'comlink';

export class Example {
    async add(a: number, b: number) {
        //time consuming
        await new Promise((resolve) => setTimeout(resolve, 500));
        return a + b;
    }
}
Comlink.expose(new Example());