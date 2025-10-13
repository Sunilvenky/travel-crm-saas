import { AsyncLocalStorage } from 'async_hooks';

type Context = { tenantId?: string, userId?: string };
export const reqStore = new AsyncLocalStorage<Context>();

export function runWithContext(ctx: Context, fn: () => Promise<void> | void){
  return reqStore.run(ctx, fn);
}

export function getContext(){
  return reqStore.getStore() || {};
}
