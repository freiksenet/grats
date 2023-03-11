/** @GQLType */
export default class Query {
  /** @GQLField */
  me(): User {
    return new User();
  }
}

/** @GQLInterface Person */
interface IPerson {
  /** @GQLField */
  name: string;
}

/** @GQLType */
class User implements IPerson {
  /** @GQLField */
  name: string;
}
