import { GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { query_selector_all } from 'svelte/internal';

export const createSchema = async () => {
	// You can substitute this with any way you want to build your schema
	// (that's why this is in an async function -- for libraries like TypeGraphQL)
	return new GraphQLSchema({
			
		query: new GraphQLObjectType({
			name: 'Query',
			description: 'The main entrypoint to our API',
			fields: {
				double: {
					args: {
						number: { description: 'The number to multiply', type: GraphQLInt }
					},
					description: 'Get the number, times two',
					type: GraphQLInt,
					resolve(_source, { number }, { authorization }) {
						// Do what you want with authorization
						return number * 2;
					}
				},
			},
			
			
		}),
		

	});


	
	
		

};

export const defaultQuery = `# Try out our API with a query like this:

query {
	double(number: 12)
}
`;



export const AddressType = new GraphQLObjectType({
  name: 'Address',
  fields: {
    street: { type: GraphQLString },
    number: { type: GraphQLInt },
    formatted: {
      type: GraphQLString,
      resolve(obj) {
        return obj.number + ' ' + obj.street
      }
    }
  }
});

export const PersonType = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    name: { type: GraphQLString },
    bestFriend: { type: PersonType },
  })
});

export const linkType = new GraphQLObjectType({
  name: 'Link',
  fields: {
    url: { type: GraphQLString },
    point: { type: GraphQLInt },
	owner:{type:PersonType},
  }
});