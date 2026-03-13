#!/bin/bash
# Apollo GraphOS Setup Script
# Run this to publish all subgraph schemas to Apollo GraphOS
#
# Usage:
#   APOLLO_KEY=your-api-key GRAPH_REF=gebeta-production@current ./scripts/publish-subgraphs.sh
#
# Prerequisites:
#   1. Install Rover: iwr 'https://rover.apollo.dev/win/latest' | iex
#   2. Authenticate: rover config auth
#   3. Set environment variables above

set -e

# Check for required environment variables
if [ -z "$APOLLO_KEY" ]; then
    echo "Error: APOLLO_KEY environment variable not set"
    echo "Get your key from: https://studio.apollographql.com/settings/api-keys"
    exit 1
fi

if [ -z "$GRAPH_REF" ]; then
    echo "Error: GRAPH_REF environment variable not set"
    echo "Format: graph-name@variant (e.g., gebeta-production@current)"
    exit 1
fi

echo "=========================================="
echo "Publishing subgraphs to Apollo GraphOS"
echo "Graph: $GRAPH_REF"
echo "=========================================="

# Configure Rover with the API key
echo "Configuring Rover..."
rover config auth $APOLLO_KEY

# Base URL for the GraphQL endpoint (update this for production)
ROUTING_URL="${ROUTING_URL:-https://gebeta.app/api/graphql}"

# Publish each subgraph
echo ""
echo "Publishing Orders subgraph..."
rover graph publish $GRAPH_REF \
    --schema ./src/domains/orders/schema.graphql \
    --name orders \
    --routing-url $ROUTING_URL

echo "Publishing Menu subgraph..."
rover graph publish $GRAPH_REF \
    --schema ./src/domains/menu/schema.graphql \
    --name menu \
    --routing-url $ROUTING_URL

echo "Publishing Payments subgraph..."
rover graph publish $GRAPH_REF \
    --schema ./src/domains/payments/schema.graphql \
    --name payments \
    --routing-url $ROUTING_URL

echo "Publishing Guests subgraph..."
rover graph publish $GRAPH_REF \
    --schema ./src/domains/guests/schema.graphql \
    --name guests \
    --routing-url $ROUTING_URL

echo "Publishing Staff subgraph..."
rover graph publish $GRAPH_REF \
    --schema ./src/domains/staff/schema.graphql \
    --name staff \
    --routing-url $ROUTING_URL

echo ""
echo "=========================================="
echo "All subgraphs published successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to Apollo GraphOS Studio to view your graph"
echo "2. Deploy Apollo Router to Railway"
echo "3. Set APOLLO_KEY and APOLLO_GRAPH_REF in Railway"
