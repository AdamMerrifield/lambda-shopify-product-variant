/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import * as AdminTypes from './admin.types.d.ts';

export type ProductQueryQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type ProductQueryQuery = { product?: AdminTypes.Maybe<(
    Pick<AdminTypes.Product, 'id' | 'title' | 'handle'>
    & { metafields: { edges: Array<{ node: Pick<AdminTypes.Metafield, 'key' | 'value'> }> } }
  )> };

interface GeneratedQueryTypes {
  "#graphql\n  query ProductQuery($id: ID!) {\n    product(id: $id) {\n      id\n      title\n      handle\n\n      metafields (first:100) {\n        edges {\n          node {\n            key\n            value\n          }\n        }\n      }\n    }\n  }\n": {return: ProductQueryQuery, variables: ProductQueryQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
