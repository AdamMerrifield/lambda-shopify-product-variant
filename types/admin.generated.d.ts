/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import * as AdminTypes from './admin.types.d.ts';

export type ProductUpdateMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.ProductInput;
}>;


export type ProductUpdateMutation = { productUpdate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<{ metafields: { edges: Array<{ node: Pick<AdminTypes.Metafield, 'id' | 'namespace' | 'key' | 'value'> }> } }> }> };

export type MetafieldDeleteMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.MetafieldDeleteInput;
}>;


export type MetafieldDeleteMutation = { metafieldDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.MetafieldDeletePayload, 'deletedId'>
    & { userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }
  )> };

export type ProductsQueryQueryVariables = AdminTypes.Exact<{
  numProducts: AdminTypes.Scalars['Int']['input'];
  cursor?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type ProductsQueryQuery = { products: { nodes: Array<(
      Pick<AdminTypes.Product, 'id' | 'title' | 'handle'>
      & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

interface GeneratedQueryTypes {
  "#graphql\n  query ProductsQuery($numProducts: Int!, $cursor: String){\n    products(first: $numProducts, after: $cursor) {\n      nodes {\n        id\n        title\n        handle\n\n        metafield(namespace: \"customizer\", key: \"Paper Stock\") {\n          value\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: ProductsQueryQuery, variables: ProductsQueryQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation productUpdate($input: ProductInput!) {\n    productUpdate(input: $input) {\n      product {\n        metafields(first: 100) {\n          edges {\n            node {\n              id\n              namespace\n              key\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: ProductUpdateMutation, variables: ProductUpdateMutationVariables},
  "#graphql\n  mutation metafieldDelete($input: MetafieldDeleteInput!) {\n    metafieldDelete(input: $input) {\n      deletedId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: MetafieldDeleteMutation, variables: MetafieldDeleteMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
