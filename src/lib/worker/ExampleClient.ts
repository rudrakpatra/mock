import type Comlink from 'comlink';
import type { Example } from './ExampleWorker';
class ExampleClient {
    async load() {
        const Comlink = await import('comlink');
        const ExampleWorker = await import('./ExampleWorker?worker');
        //simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return Comlink.wrap(new ExampleWorker.default()) as Comlink.Remote<Example>;
    }
}

export default new ExampleClient();