#!/bin/bash
# =============================================================================
# lole Rollback Script
# =============================================================================
# Local script to rollback Vercel deployments.
# Requires Vercel CLI to be installed: npm i -g vercel
#
# Usage:
#   ./scripts/rollback.sh [options]
#
# Options:
#   -e, --environment    Target environment (production, staging) [default: production]
#   -t, --type          Rollback type: previous, deployment_id, versions_back [default: previous]
#   -d, --deployment    Deployment ID (required for deployment_id type)
#   -v, --versions      Number of versions back [default: 1]
#   -r, --reason        Reason for rollback [default: Manual rollback via CLI]
#   -y, --yes           Skip confirmation prompt
#   -h, --help          Show this help message
#
# Examples:
#   # Rollback to previous deployment (production)
#   ./scripts/rollback.sh
#
#   # Rollback staging to previous
#   ./scripts/rollback.sh --environment staging
#
#   # Rollback to specific deployment ID
#   ./scripts/rollback.sh --type deployment_id --deployment dpl_xxxxx
#
#   # Rollback 2 versions back
#   ./scripts/rollback.sh --type versions_back --versions 2
#
#   # Rollback with custom reason
#   ./scripts/rollback.sh --reason "Fixing critical bug in payment flow"
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
ROLLBACK_TYPE="previous"
DEPLOYMENT_ID=""
VERSIONS_BACK=1
REASON="Manual rollback via CLI"
SKIP_CONFIRM=false

# Project names per environment
declare -A PROJECT_NAMES
PROJECT_NAMES["production"]="lole"
PROJECT_NAMES["staging"]="lole-staging"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    grep -E '^#' "$0" | sed 's/^# //' | sed 's/^#//'
    exit 0
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Install it with: npm i -g vercel"
        exit 1
    fi
}

# Check if user is logged in to Vercel
check_vercel_auth() {
    log_info "Checking Vercel authentication..."
    if ! vercel whoami &> /dev/null; then
        log_error "Not logged in to Vercel. Run 'vercel login' first."
        exit 1
    fi
    log_success "Authenticated as: $(vercel whoami)"
}

# Get deployment list
get_deployments() {
    local project_name="$1"
    local limit="${2:-10}"
    
    log_info "Fetching deployments for $project_name..."
    vercel list "$project_name" --limit "$limit"
}

# Get current deployment ID
get_current_deployment() {
    local project_name="$1"
    local deployments
    deployments=$(vercel list "$project_name" --limit 5 2>&1)
    
    # Parse the deployment ID from the output
    local current_deployment
    current_deployment=$(echo "$deployments" | grep -v "Vercel CLI" | grep -v "^$" | grep -v "State" | head -5 | tail -1 | awk '{print $1}')
    
    echo "$current_deployment"
}

# Get target deployment based on rollback type
get_target_deployment() {
    local project_name="$1"
    local type="$2"
    local versions="$3"
    local deployment_id="$4"
    
    case "$type" in
        "previous")
            log_info "Finding previous deployment..."
            local deployments
            deployments=$(vercel list "$project_name" --limit 5 2>&1)
            local target
            target=$(echo "$deployments" | grep -v "Vercel CLI" | grep -v "^$" | grep -v "State" | head -5 | tail -1 | awk '{print $1}')
            echo "$target"
            ;;
        "deployment_id")
            if [ -z "$deployment_id" ]; then
                log_error "Deployment ID is required for deployment_id rollback type"
                exit 1
            fi
            echo "$deployment_id"
            ;;
        "versions_back")
            log_info "Finding deployment $versions versions back..."
            local deployments
            deployments=$(vercel list "$project_name" --limit $((versions + 2)) 2>&1)
            local target
            target=$(echo "$deployments" | grep -v "Vercel CLI" | grep -v "^$" | grep -v "State" | head -5 | tail -"$versions" | head -1 | awk '{print $1}')
            echo "$target"
            ;;
        *)
            log_error "Unknown rollback type: $type"
            exit 1
            ;;
    esac
}

# Confirm rollback
confirm_rollback() {
    local project_name="$1"
    local target_deployment="$2"
    local current_deployment="$3"
    
    if [ "$SKIP_CONFIRM" = true ]; then
        return 0
    fi
    
    echo ""
    log_warning "You are about to rollback:"
    echo "  Project:      $project_name"
    echo "  Environment:  $ENVIRONMENT"
    echo "  Rollback to:  $target_deployment"
    echo "  Current:      $current_deployment"
    echo "  Reason:       $REASON"
    echo ""
    
    read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled."
        exit 0
    fi
}

# Perform rollback
perform_rollback() {
    local project_name="$1"
    local target_deployment="$2"
    
    log_info "Performing rollback to $target_deployment..."
    
    local output
    output=$(vercel rollback "$project_name" "$target_deployment" --yes 2>&1)
    local exit_code=$?
    
    echo "$output"
    
    if [ $exit_code -eq 0 ]; then
        log_success "Rollback initiated successfully!"
        echo ""
        echo "The deployment will be promoted to production shortly."
        echo "You can monitor the progress in the Vercel dashboard."
    else
        log_error "Rollback failed with exit code: $exit_code"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Main Script
# -----------------------------------------------------------------------------

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--type)
            ROLLBACK_TYPE="$2"
            shift 2
            ;;
        -d|--deployment)
            DEPLOYMENT_ID="$2"
            shift 2
            ;;
        -v|--versions)
            VERSIONS_BACK="$2"
            shift 2
            ;;
        -r|--reason)
            REASON="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Validate inputs
if [ -z "${PROJECT_NAMES[$ENVIRONMENT]}" ]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: production, staging"
    exit 1
fi

if [ "$ROLLBACK_TYPE" = "deployment_id" ] && [ -z "$DEPLOYMENT_ID" ]; then
    log_error "Deployment ID is required for deployment_id rollback type"
    exit 1
fi

# Get project name
PROJECT_NAME="${PROJECT_NAMES[$ENVIRONMENT]}"

# Check prerequisites
check_vercel_cli
check_vercel_auth

# Get deployments
echo ""
log_info "=== Current Deployments ==="
get_deployments "$PROJECT_NAME"

# Get current deployment
CURRENT_DEPLOYMENT=$(get_current_deployment "$PROJECT_NAME")
log_info "Current deployment: $CURRENT_DEPLOYMENT"

# Get target deployment
TARGET_DEPLOYMENT=$(get_target_deployment "$PROJECT_NAME" "$ROLLBACK_TYPE" "$VERSIONS_BACK" "$DEPLOYMENT_ID")
log_info "Target deployment: $TARGET_DEPLOYMENT"

# Confirm rollback
confirm_rollback "$PROJECT_NAME" "$TARGET_DEPLOYMENT" "$CURRENT_DEPLOYMENT"

# Perform rollback
echo ""
log_info "=== Executing Rollback ==="
perform_rollback "$PROJECT_NAME" "$TARGET_DEPLOYMENT"

# Wait and show status
echo ""
log_info "Waiting for deployment to become ready..."
sleep 5

echo ""
log_success "=== Rollback Complete ==="
echo ""
echo "Next steps:"
echo "  1. Verify the application is working correctly"
echo "  2. Check the Vercel dashboard for deployment status"
echo "  3. Monitor for any issues in Sentry/logs"
echo ""
echo "If issues persist, you can rollback again to an earlier version."
