const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { config } = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

/*
type EventProperty {
            name: String
            type: String
            value: EventPropertyType
        }

        type Event {
            name: String
            properties: [EventProperty]
        }

 */
function formatEventProperty(prop) {
    const { value } = prop;
    if (typeof value === 'string') {
        return {
            ...prop,
            value: {
                property: {
                    str: value
                }
            }
        }
    } else if (typeof value === 'number') {
        return {
            ...prop,
            value: {
                property: {
                    int: value
                }
            }
        }
    } else {
        console.log('SOME ISSUE HERE');
        if (Array.isArray(value)) {
            return {
                ...prop,
                value: {
                    property: formatEventProperty(value)
                }
            }
        } else {
            return {
                ...prop,
                value: {
                    properties: value.map((val) => formatEventProperty(val))
                }
            }
        }
        // value: Array.isArray(value) ? value.map(val => formatEventProperty(val)) : formatEventProperty(value)
    }
}

async function main() {
    if (process.env.NODE_ENV !== 'production') {
        config();
    }

    const uri = process.env.MONGODB_URI;

    const client = new MongoClient(uri,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: ServerApiVersion.v1
        }
    );

    await client.connect();

    const database = client.db('vybe');

    // console.log('DATA: ', await database.collection('transactions').find({}).toArray());

    // Construct a schema, using GraphQL schema language
    // TODO: string to enum status
    const typeDefs = gql`
        type StringWrap {
            str: String
        }
        
        type IntWrap {
            int: Int
        }
        
        union EventPropertyType = StringWrap | IntWrap | EventProperty
        type EventPropertyTypeWithArray {
            property: EventPropertyType
            properties: [EventProperty]
        }
        
        type EventProperty {
            name: String
            type: String
            value: EventPropertyTypeWithArray
        }
        
        type Event {
            name: String
            properties: [EventProperty]
        }
        
        type Transaction {
            events: [Event]
            signature: String
            blockTime: Int
            confirmationStatus: String
        }
        
        type Query {
            transactions: [Transaction]
        }
    `;

    // Provide resolver functions for your schema fields
    const resolvers = {
        EventPropertyType: {
            __resolveType(obj, contextValue, info) {
                console.log('OBJ', obj);
                // if (Array.isArray(obj)) {
                //     return ''
                // }
                if ('str' in obj) {
                    return 'StringWrap';
                } else if ('int' in obj) {
                    return 'IntWrap';
                } else if (obj.value) {
                    return 'EventProperty';
                }

                console.log('MUST BE NULL HERE', obj)

                return null;
            }
        },
        Query: {
            transactions: async () => {
                const data = await database.collection('transactions').find({}).toArray();
                // console.log(JSON.stringify(data));

                const res = data.map(
                    ({_id, events, signature, blockTime, confirmationStatus}) => {
                        return {
                            events: events.map(
                                (event) => {
                                    return {
                                        ...event,
                                        properties: event.properties.map(
                                            (prop) => formatEventProperty(prop)
                                        )
                                    }
                                }
                            ),
                            signature,
                            blockTime,
                            confirmationStatus
                        }
                    }
                );

                // console.log(JSON.stringify(res));

                return res;
            }
        },
    };

    const server = new ApolloServer({ typeDefs, resolvers });

    const app = express();

    await server.start();

    server.applyMiddleware({ app });

    app.listen({ port: 4000 }, () =>
        console.log(`🚀 Server ready at http://localhost:4000${ server.graphqlPath }`)
    );
}

void main();