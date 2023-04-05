(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("mango-parser", [], factory);
	else if(typeof exports === 'object')
		exports["mango-parser"] = factory();
	else
		root["mango-parser"] = factory();
})(global, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "graphqlHandler": () => (/* binding */ graphqlHandler)
});

;// CONCATENATED MODULE: external "express"
const external_express_namespaceObject = require("express");
var external_express_default = /*#__PURE__*/__webpack_require__.n(external_express_namespaceObject);
;// CONCATENATED MODULE: external "@apollo/server"
const server_namespaceObject = require("@apollo/server");
;// CONCATENATED MODULE: external "dotenv"
const external_dotenv_namespaceObject = require("dotenv");
;// CONCATENATED MODULE: external "mongodb"
const external_mongodb_namespaceObject = require("mongodb");
;// CONCATENATED MODULE: external "@as-integrations/aws-lambda"
const aws_lambda_namespaceObject = require("@as-integrations/aws-lambda");
;// CONCATENATED MODULE: ./src/index.js






const app = external_express_default()();

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
    }
}

function setupApollo() {
    const uri = process.env.MONGODB_URI;

    const client = new external_mongodb_namespaceObject.MongoClient(uri,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: external_mongodb_namespaceObject.ServerApiVersion.v1
        }
    );

    client.connect().then(
        () => console.log('successfully connected!')
    );

    const database = client.db('vybe');

    // Construct a schema, using GraphQL schema language
    // TODO: string to enum status
    const typeDefs = `#graphql
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
                if ('str' in obj) {
                    return 'StringWrap';
                } else if ('int' in obj) {
                    return 'IntWrap';
                } else if (obj.value) {
                    return 'EventProperty';
                }

                return null;
            }
        },
        Query: {
            transactions: async () => {
                const data = await database.collection('transactions').find({}).toArray();

                return data.map(
                    ({ _id, events, signature, blockTime, confirmationStatus }) => {
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
            }
        },
    };

    return new server_namespaceObject.ApolloServer({ typeDefs, resolvers });
}

const server = setupApollo();

// This final export is important!
const graphqlHandler = (0,aws_lambda_namespaceObject.startServerAndCreateLambdaHandler)(
    server,
    // We will be using the Proxy V2 handler
    aws_lambda_namespaceObject.handlers.createAPIGatewayProxyEventV2RequestHandler()
);
/******/ 	return __webpack_exports__;
/******/ })()
;
});