/** @GQLType */
class Query {
  /** @GQLField */
  foo: string;
}

/** @GQLInterface */
interface IFoo {
  /** @GQLField */
  bar: string;
}

/** @GQLExtendType */
export function greeting(iFoo: IFoo): string {
  return "Hello world!";
}
