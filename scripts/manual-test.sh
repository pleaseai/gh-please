#!/usr/bin/env bash

# Manual Test Script for gh-please Extension
# This script helps set up a test environment and run quick smoke tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
SKIPPED=0

# Helper functions
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
  echo -e "${YELLOW}▶ Test: $1${NC}"
}

print_pass() {
  echo -e "${GREEN}✓ PASS: $1${NC}"
  ((PASSED++))
}

print_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  ((FAILED++))
}

print_skip() {
  echo -e "${YELLOW}⊘ SKIP: $1${NC}"
  ((SKIPPED++))
}

print_info() {
  echo -e "${BLUE}ℹ INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  if ! command -v gh &> /dev/null; then
    print_fail "gh CLI not found"
    echo "Please install GitHub CLI: https://cli.github.com/"
    exit 1
  fi
  print_pass "gh CLI installed"

  if ! gh auth status &> /dev/null; then
    print_fail "gh CLI not authenticated"
    echo "Please run: gh auth login"
    exit 1
  fi
  print_pass "gh CLI authenticated"

  if ! gh extension list | grep -q "please"; then
    print_fail "gh-please extension not installed"
    echo "Please run: gh extension install ."
    exit 1
  fi
  print_pass "gh-please extension installed"
}

# Get repository info
get_repo_info() {
  print_header "Repository Information"

  if ! REPO_INFO=$(gh repo view --json owner,name 2>&1); then
    print_fail "Not in a git repository"
    echo "Please run this script from a git repository directory"
    exit 1
  fi

  OWNER=$(echo "$REPO_INFO" | jq -r '.owner.login')
  REPO=$(echo "$REPO_INFO" | jq -r '.name')

  print_info "Repository: $OWNER/$REPO"

  echo -e "\n${YELLOW}⚠ WARNING: This script will create test issues in $OWNER/$REPO${NC}"
  echo -e "${YELLOW}It is recommended to use a dedicated test repository.${NC}\n"

  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
}

# Setup test data
setup_test_data() {
  print_header "Setting Up Test Data"

  print_info "Creating test issues..."

  # Create parent issue
  PARENT_ISSUE=$(gh issue create --title "[TEST] Parent Issue" --body "Test parent issue for sub-issue testing" --json number | jq -r '.number')
  print_pass "Created parent issue #$PARENT_ISSUE"

  # Create child issue
  CHILD_ISSUE=$(gh issue create --title "[TEST] Child Issue" --body "Test child issue to be linked" --json number | jq -r '.number')
  print_pass "Created child issue #$CHILD_ISSUE"

  # Create blocking issue
  BLOCKING_ISSUE=$(gh issue create --title "[TEST] Blocking Issue" --body "Test blocking issue" --json number | jq -r '.number')
  print_pass "Created blocking issue #$BLOCKING_ISSUE"

  # Create blocked issue
  BLOCKED_ISSUE=$(gh issue create --title "[TEST] Blocked Issue" --body "Test blocked issue" --json number | jq -r '.number')
  print_pass "Created blocked issue #$BLOCKED_ISSUE"

  # Export for use in tests
  export PARENT_ISSUE CHILD_ISSUE BLOCKING_ISSUE BLOCKED_ISSUE

  print_info "Test data created:"
  echo "  PARENT_ISSUE=$PARENT_ISSUE"
  echo "  CHILD_ISSUE=$CHILD_ISSUE"
  echo "  BLOCKING_ISSUE=$BLOCKING_ISSUE"
  echo "  BLOCKED_ISSUE=$BLOCKED_ISSUE"
}

# Test AI commands
test_ai_commands() {
  print_header "Testing AI Commands"

  # Test triage
  print_test "gh please ai triage"
  if gh please ai triage "$PARENT_ISSUE" 2>&1 | grep -q "Triage request posted"; then
    print_pass "ai triage command"
  else
    print_fail "ai triage command"
  fi

  # Test investigate
  print_test "gh please ai investigate"
  if gh please ai investigate "$CHILD_ISSUE" 2>&1 | grep -q "Investigation request posted"; then
    print_pass "ai investigate command"
  else
    print_fail "ai investigate command"
  fi

  # Test fix
  print_test "gh please ai fix"
  if gh please ai fix "$BLOCKING_ISSUE" 2>&1 | grep -q "Fix request posted"; then
    print_pass "ai fix command"
  else
    print_fail "ai fix command"
  fi
}

# Test sub-issue commands
test_sub_issue_commands() {
  print_header "Testing Sub-issue Commands"

  # Test create
  print_test "gh please issue sub-issue create"
  if SUB_ISSUE=$(gh please issue sub-issue create "$PARENT_ISSUE" --title "[TEST] Sub-issue" --body "Test sub-issue" 2>&1 | grep -oP 'Sub-issue #\K\d+'); then
    print_pass "sub-issue create command (created #$SUB_ISSUE)"
    export SUB_ISSUE
  else
    print_fail "sub-issue create command"
    SUB_ISSUE=""
  fi

  # Test add
  print_test "gh please issue sub-issue add"
  if gh please issue sub-issue add "$PARENT_ISSUE" "$CHILD_ISSUE" 2>&1 | grep -q "linked as sub-issue"; then
    print_pass "sub-issue add command"
  else
    print_fail "sub-issue add command"
  fi

  # Test list
  print_test "gh please issue sub-issue list"
  if OUTPUT=$(gh please issue sub-issue list "$PARENT_ISSUE" 2>&1); then
    if echo "$OUTPUT" | grep -q "#$CHILD_ISSUE"; then
      print_pass "sub-issue list command (found #$CHILD_ISSUE)"
    else
      print_fail "sub-issue list command (missing #$CHILD_ISSUE)"
    fi
  else
    print_fail "sub-issue list command"
  fi

  # Test remove
  print_test "gh please issue sub-issue remove"
  if gh please issue sub-issue remove "$PARENT_ISSUE" "$CHILD_ISSUE" 2>&1 | grep -q "unlinked"; then
    print_pass "sub-issue remove command"
  else
    print_fail "sub-issue remove command"
  fi
}

# Test dependency commands
test_dependency_commands() {
  print_header "Testing Dependency Commands"

  # Test add
  print_test "gh please issue dependency add"
  if gh please issue dependency add "$BLOCKED_ISSUE" --blocked-by "$BLOCKING_ISSUE" 2>&1 | grep -q "blocked by"; then
    print_pass "dependency add command"
  else
    print_fail "dependency add command"
  fi

  # Test list
  print_test "gh please issue dependency list"
  if OUTPUT=$(gh please issue dependency list "$BLOCKED_ISSUE" 2>&1); then
    if echo "$OUTPUT" | grep -q "#$BLOCKING_ISSUE"; then
      print_pass "dependency list command (found #$BLOCKING_ISSUE)"
    else
      print_fail "dependency list command (missing #$BLOCKING_ISSUE)"
    fi
  else
    print_fail "dependency list command"
  fi

  # Test remove
  print_test "gh please issue dependency remove"
  if gh please issue dependency remove "$BLOCKED_ISSUE" "$BLOCKING_ISSUE" 2>&1 | grep -q "no longer blocked"; then
    print_pass "dependency remove command"
  else
    print_fail "dependency remove command"
  fi
}

# Test init command
test_init_command() {
  print_header "Testing Init Command"

  # Remove existing config if present
  rm -rf .please

  print_test "gh please init"
  if gh please init 2>&1 | grep -q "Configuration file created"; then
    if [ -f ".please/config.yml" ]; then
      print_pass "init command (file created)"
    else
      print_fail "init command (file not created)"
    fi
  else
    print_fail "init command"
  fi
}

# Test error handling
test_error_handling() {
  print_header "Testing Error Handling"

  # Test invalid issue number
  print_test "Invalid issue number handling"
  if gh please ai triage 99999 2>&1 | grep -qE "(Error|not found|invalid)"; then
    print_pass "Invalid issue number error"
  else
    print_fail "Invalid issue number error"
  fi

  # Test non-numeric input
  print_test "Non-numeric input handling"
  if gh please ai triage "abc" 2>&1 | grep -qE "(Error|invalid)"; then
    print_pass "Non-numeric input error"
  else
    print_fail "Non-numeric input error"
  fi
}

# Cleanup test data
cleanup_test_data() {
  print_header "Cleaning Up Test Data"

  print_info "Closing test issues..."

  # Close all test issues
  for ISSUE_NUM in $PARENT_ISSUE $CHILD_ISSUE $BLOCKING_ISSUE $BLOCKED_ISSUE $SUB_ISSUE; do
    if [ -n "$ISSUE_NUM" ]; then
      if gh issue close "$ISSUE_NUM" --comment "Closing test issue" &> /dev/null; then
        print_pass "Closed issue #$ISSUE_NUM"
      else
        print_skip "Failed to close issue #$ISSUE_NUM"
      fi
    fi
  done

  # Remove test config
  if [ -f ".please/config.yml" ]; then
    rm -rf .please
    print_pass "Removed test config"
  fi
}

# Print summary
print_summary() {
  print_header "Test Summary"

  TOTAL=$((PASSED + FAILED + SKIPPED))

  echo -e "Total tests: $TOTAL"
  echo -e "${GREEN}Passed: $PASSED${NC}"
  echo -e "${RED}Failed: $FAILED${NC}"
  echo -e "${YELLOW}Skipped: $SKIPPED${NC}"

  if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
  else
    echo -e "\n${RED}❌ Some tests failed${NC}\n"
    exit 1
  fi
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════╗"
  echo "║   gh-please Manual Test Script        ║"
  echo "╔════════════════════════════════════════╗"
  echo -e "${NC}"

  check_prerequisites
  get_repo_info
  setup_test_data

  test_ai_commands
  test_sub_issue_commands
  test_dependency_commands
  test_init_command
  test_error_handling

  cleanup_test_data
  print_summary
}

# Run main function
main "$@"
