// Shared Apollo Server Configuration for Subgraphs
// Provides query depth limiting, complexity analysis, CSRF prevention, and secure error formatting
// This addresses CRITICAL-004 from the GraphQL Security Audit

import { ApolloServer } from '@apollo/server';
import { GraphQLError, ValidationContext, ASTVisitor } from 'graphql';
import type { GraphQLContext } from './context';

export interface SubgraphConfig {
    typeDefs: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: any;
}

const DEPTH_LIMIT = 10;
const COMPLEXITY_LIMIT = 1000;

// Type definitions for AST traversal
interface ASTNode {
    kind: string;
    name?: { value: string };
    selectionSet?: { selections: ASTNode[] };
    definitions?: ASTNode[];
    [key: string]: unknown;
}

/**
 * Depth limit validation rule to prevent deeply nested queries
 * that could cause DoS through excessive resource consumption
 */
function depthLimitRule(maxDepth: number): (context: ValidationContext) => ASTVisitor {
    return (context: ValidationContext) =>
        ({
            Document(node: ASTNode) {
                const checkDepth = (node: ASTNode, currentDepth: number): number => {
                    if (currentDepth > maxDepth) {
                        context.reportError(
                            new GraphQLError(
                                `Query depth ${currentDepth} exceeds maximum allowed ${maxDepth}`,
                                { extensions: { code: 'BAD_USER_INPUT' } }
                            )
                        );
                        return currentDepth;
                    }

                    let maxChildDepth = currentDepth;

                    if (node.selectionSet) {
                        for (const selection of node.selectionSet.selections) {
                            const childDepth = checkDepth(selection, currentDepth + 1);
                            maxChildDepth = Math.max(maxChildDepth, childDepth);
                        }
                    }

                    return maxChildDepth;
                };

                if (node.definitions) {
                    for (const definition of node.definitions) {
                        checkDepth(definition, 0);
                    }
                }
            },
        }) as ASTVisitor;
}

/**
 * Complexity limit validation rule to prevent expensive queries
 * Uses a simple heuristic where each field adds 1 complexity point
 */
function complexityLimitRule(maxComplexity: number): (context: ValidationContext) => ASTVisitor {
    return (context: ValidationContext) => {
        let totalComplexity = 0;

        return {
            Field(node: ASTNode): ASTNode | undefined {
                // Simple heuristic: each field adds 1 complexity
                // Mutations and nested fields could add more in a more sophisticated implementation
                totalComplexity += 1;
                return undefined;
            },
            Document: {
                leave(_node: ASTNode) {
                    if (totalComplexity > maxComplexity) {
                        context.reportError(
                            new GraphQLError(
                                `Query complexity ${totalComplexity} exceeds maximum allowed ${maxComplexity}`,
                                { extensions: { code: 'BAD_USER_INPUT' } }
                            )
                        );
                    }
                },
            },
        } as ASTVisitor;
    };
}

/**
 * Creates a configured Apollo Server instance for subgraphs
 * with security features enabled:
 * - Query depth limiting (max 10 levels)
 * - Query complexity limiting (max 1000 points)
 * - CSRF prevention
 * - Secure error formatting (no internal errors exposed in production)
 */
export function createSubgraphServer(config: SubgraphConfig): ApolloServer<GraphQLContext> {
    return new ApolloServer<GraphQLContext>({
        typeDefs: config.typeDefs,
        resolvers: config.resolvers,
        introspection: process.env.NODE_ENV !== 'production',

        // Add validation rules for security
        validationRules: [depthLimitRule(DEPTH_LIMIT), complexityLimitRule(COMPLEXITY_LIMIT)],

        // Enable CSRF prevention
        csrfPrevention: true,

        // Configure error formatting
        formatError: (formattedError, error) => {
            // Log internal errors for debugging
            if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
                console.error('GraphQL Internal Error:', error);
            }

            // Don't expose internal errors to clients in production
            if (process.env.NODE_ENV === 'production') {
                if (!formattedError.extensions?.code) {
                    return new GraphQLError('Internal server error', {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }
            }

            return formattedError;
        },
    });
}
