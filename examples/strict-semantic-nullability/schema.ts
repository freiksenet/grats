/**
 * Executable schema generated by Grats (https://grats.capt.dev)
 * Do not manually edit. Regenerate by running `npx grats`.
 */
import { allUsers as queryAllUsersResolver } from "./models/User";
import { me as queryMeResolver } from "./Query";
import { person as queryPersonResolver } from "./Query";
import { countdown as subscriptionCountdownResolver } from "./Subscription";
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLNonNull, GraphQLString, GraphQLInterfaceType, GraphQLInt } from "graphql";
export function getSchema(): GraphQLSchema {
    const GroupType: GraphQLObjectType = new GraphQLObjectType({
        name: "Group",
        fields() {
            return {
                description: {
                    name: "description",
                    type: GraphQLString
                },
                id: {
                    name: "id",
                    type: new GraphQLNonNull(GraphQLString)
                },
                members: {
                    name: "members",
                    type: new GraphQLList(new GraphQLNonNull(UserType))
                },
                name: {
                    name: "name",
                    type: GraphQLString
                }
            };
        }
    });
    const IPersonType: GraphQLInterfaceType = new GraphQLInterfaceType({
        name: "IPerson",
        fields() {
            return {
                name: {
                    name: "name",
                    type: GraphQLString
                }
            };
        }
    });
    const UserType: GraphQLObjectType = new GraphQLObjectType({
        name: "User",
        fields() {
            return {
                groups: {
                    name: "groups",
                    type: new GraphQLList(new GraphQLNonNull(GroupType))
                },
                name: {
                    name: "name",
                    type: GraphQLString
                }
            };
        },
        interfaces() {
            return [IPersonType];
        }
    });
    const QueryType: GraphQLObjectType = new GraphQLObjectType({
        name: "Query",
        fields() {
            return {
                allUsers: {
                    name: "allUsers",
                    type: new GraphQLList(new GraphQLNonNull(UserType)),
                    resolve(source) {
                        return queryAllUsersResolver(source);
                    }
                },
                me: {
                    name: "me",
                    type: UserType,
                    resolve(source) {
                        return queryMeResolver(source);
                    }
                },
                person: {
                    name: "person",
                    type: IPersonType,
                    resolve(source) {
                        return queryPersonResolver(source);
                    }
                }
            };
        }
    });
    const SubscriptionType: GraphQLObjectType = new GraphQLObjectType({
        name: "Subscription",
        fields() {
            return {
                countdown: {
                    name: "countdown",
                    type: GraphQLInt,
                    args: {
                        from: {
                            name: "from",
                            type: new GraphQLNonNull(GraphQLInt)
                        }
                    },
                    subscribe(source, args) {
                        return subscriptionCountdownResolver(source, args);
                    },
                    resolve(payload) {
                        return payload;
                    }
                }
            };
        }
    });
    return new GraphQLSchema({
        query: QueryType,
        subscription: SubscriptionType,
        types: [GroupType, IPersonType, QueryType, SubscriptionType, UserType]
    });
}