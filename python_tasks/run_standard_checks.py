#!/usr/bin/env python3
"""
NeuroKid Great Expectations Data Validation Suite.

This script demonstrates industry-standard data validation using Great Expectations,
complementing our custom Quarantine Engine for comprehensive data quality coverage.

Architecture Decision:
- Great Expectations: Standardized, declarative expectations for common patterns
- Quarantine Engine: Custom business logic, PHI detection, and ETL flow control

Usage:
    python run_standard_checks.py [--table User] [--verbose]

Author: NeuroKid Data Engineering Team
"""

import os
import sys
import asyncio
import argparse
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from sqlalchemy import text

# Great Expectations imports
try:
    import great_expectations as gx
    from great_expectations.core.expectation_suite import ExpectationSuite
    from great_expectations.expectations.expectation import ExpectationConfiguration
    GX_AVAILABLE = True
except ImportError:
    GX_AVAILABLE = False
    print("[WARN] Great Expectations not installed. Run: pip install great_expectations")

from database import get_session


class StandardDataValidator:
    """
    Industry-Standard Data Validation using Great Expectations.

    This class bridges our async database layer with GX's validation framework,
    providing declarative data quality checks that are:
    - Portable: YAML-based expectation suites
    - Auditable: Validation results stored for compliance
    - Extensible: Custom expectations for healthcare data
    """

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.results: List[Dict[str, Any]] = []

    async def load_table_data(self, table_name: str, limit: int = 10000) -> pd.DataFrame:
        """
        Load table data into a Pandas DataFrame for validation.

        Args:
            table_name: Name of the database table
            limit: Maximum rows to load (for performance)

        Returns:
            DataFrame with table contents
        """
        async with get_session() as session:
            query = text(f'SELECT * FROM "{table_name}" LIMIT :limit')
            result = await session.execute(query, {"limit": limit})
            rows = result.mappings().all()
            return pd.DataFrame(rows)

    def create_user_expectations(self) -> List[Dict[str, Any]]:
        """
        Define expectations for the User table.

        Returns:
            List of expectation configurations for GX
        """
        return [
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "id"},
                "meta": {"notes": "Primary key must exist"}
            },
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "email"},
                "meta": {"notes": "Email is required for user identification"}
            },
            {
                "expectation_type": "expect_column_values_to_not_be_null",
                "kwargs": {"column": "email"},
                "meta": {"notes": "HIPAA: User identity must be established"}
            },
            {
                "expectation_type": "expect_column_values_to_match_regex",
                "kwargs": {
                    "column": "email",
                    "regex": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
                    "mostly": 0.95  # Allow 5% variance for edge cases
                },
                "meta": {"notes": "Email format validation"}
            },
            {
                "expectation_type": "expect_column_values_to_be_unique",
                "kwargs": {"column": "id"},
                "meta": {"notes": "Primary key uniqueness constraint"}
            },
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "createdAt"},
                "meta": {"notes": "Audit trail: creation timestamp required"}
            },
        ]

    def create_profile_expectations(self) -> List[Dict[str, Any]]:
        """
        Define expectations for the Profile table.

        Returns:
            List of expectation configurations
        """
        return [
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "userId"},
                "meta": {"notes": "Foreign key to User table"}
            },
            {
                "expectation_type": "expect_column_values_to_not_be_null",
                "kwargs": {"column": "userId"},
                "meta": {"notes": "Profile must be linked to a user"}
            },
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "verificationStatus"},
                "meta": {"notes": "Identity verification tracking"}
            },
        ]

    def create_screening_expectations(self) -> List[Dict[str, Any]]:
        """
        Define expectations for ScreeningResult table (PHI).

        Returns:
            List of expectation configurations for sensitive data
        """
        return [
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "userId"},
                "meta": {"notes": "PHI must be linked to user"}
            },
            {
                "expectation_type": "expect_column_values_to_not_be_null",
                "kwargs": {"column": "userId"},
                "meta": {"notes": "HIPAA: PHI chain of custody"}
            },
            {
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": "createdAt"},
                "meta": {"notes": "Audit trail for PHI access"}
            },
        ]

    def run_expectations_native(self, df: pd.DataFrame, expectations: List[Dict[str, Any]], table_name: str) -> Dict[str, Any]:
        """
        Run expectations using native pandas validation (fallback when GX unavailable).

        Args:
            df: DataFrame to validate
            expectations: List of expectation configs
            table_name: Name of table being validated

        Returns:
            Validation result summary
        """
        passed = 0
        failed = 0
        details = []

        for exp in expectations:
            exp_type = exp["expectation_type"]
            kwargs = exp.get("kwargs", {})
            result = {"expectation": exp_type, "success": False, "details": ""}

            try:
                if exp_type == "expect_column_to_exist":
                    col = kwargs.get("column")
                    result["success"] = col in df.columns
                    result["details"] = f"Column '{col}' {'exists' if result['success'] else 'missing'}"

                elif exp_type == "expect_column_values_to_not_be_null":
                    col = kwargs.get("column")
                    if col in df.columns:
                        null_count = df[col].isnull().sum()
                        result["success"] = null_count == 0
                        result["details"] = f"Null count: {null_count}"
                    else:
                        result["details"] = f"Column '{col}' not found"

                elif exp_type == "expect_column_values_to_match_regex":
                    col = kwargs.get("column")
                    regex = kwargs.get("regex")
                    mostly = kwargs.get("mostly", 1.0)
                    if col in df.columns:
                        matches = df[col].astype(str).str.match(regex, na=False)
                        match_rate = matches.sum() / max(len(df), 1)
                        result["success"] = match_rate >= mostly
                        result["details"] = f"Match rate: {match_rate:.2%} (threshold: {mostly:.0%})"
                    else:
                        result["details"] = f"Column '{col}' not found"

                elif exp_type == "expect_column_values_to_be_unique":
                    col = kwargs.get("column")
                    if col in df.columns:
                        duplicates = df[col].duplicated().sum()
                        result["success"] = duplicates == 0
                        result["details"] = f"Duplicates: {duplicates}"
                    else:
                        result["details"] = f"Column '{col}' not found"

                else:
                    result["details"] = f"Unknown expectation type: {exp_type}"

            except Exception as e:
                result["details"] = f"Error: {str(e)}"

            if result["success"]:
                passed += 1
            else:
                failed += 1
            details.append(result)

        return {
            "table": table_name,
            "total_expectations": len(expectations),
            "passed": passed,
            "failed": failed,
            "success_rate": round((passed / max(len(expectations), 1)) * 100, 1),
            "details": details,
            "validated_at": datetime.now().isoformat(),
            "engine": "Native Pandas (GX Fallback)"
        }

    def run_expectations_gx(self, df: pd.DataFrame, expectations: List[Dict[str, Any]], table_name: str) -> Dict[str, Any]:
        """
        Run expectations using Great Expectations framework.

        Args:
            df: DataFrame to validate
            expectations: List of expectation configs
            table_name: Name of table being validated

        Returns:
            Validation result summary
        """
        if not GX_AVAILABLE:
            return self.run_expectations_native(df, expectations, table_name)

        try:
            # Create ephemeral context (no filesystem state)
            context = gx.get_context()

            # Create validator from DataFrame
            validator = context.sources.pandas_default.read_dataframe(df)

            passed = 0
            failed = 0
            details = []

            for exp in expectations:
                exp_type = exp["expectation_type"]
                kwargs = exp.get("kwargs", {})

                try:
                    # Dynamically call the expectation method
                    expectation_method = getattr(validator, exp_type, None)
                    if expectation_method:
                        result = expectation_method(**kwargs)
                        success = result.success if hasattr(result, 'success') else False

                        if success:
                            passed += 1
                        else:
                            failed += 1

                        details.append({
                            "expectation": exp_type,
                            "success": success,
                            "details": str(kwargs)
                        })
                    else:
                        failed += 1
                        details.append({
                            "expectation": exp_type,
                            "success": False,
                            "details": f"Unknown expectation: {exp_type}"
                        })
                except Exception as e:
                    failed += 1
                    details.append({
                        "expectation": exp_type,
                        "success": False,
                        "details": f"Error: {str(e)}"
                    })

            return {
                "table": table_name,
                "total_expectations": len(expectations),
                "passed": passed,
                "failed": failed,
                "success_rate": round((passed / max(len(expectations), 1)) * 100, 1),
                "details": details,
                "validated_at": datetime.now().isoformat(),
                "engine": "Great Expectations"
            }

        except Exception as e:
            print(f"[WARN] GX validation failed, falling back to native: {e}")
            return self.run_expectations_native(df, expectations, table_name)

    async def validate_table(self, table_name: str) -> Dict[str, Any]:
        """
        Validate a specific table against its expectations.

        Args:
            table_name: Name of database table

        Returns:
            Validation results
        """
        print(f"\n[VALIDATE] {table_name}")
        print("-" * 40)

        # Load data
        try:
            df = await self.load_table_data(table_name)
            print(f"  Loaded {len(df)} rows")
        except Exception as e:
            return {
                "table": table_name,
                "error": str(e),
                "success_rate": 0,
                "validated_at": datetime.now().isoformat()
            }

        if df.empty:
            print(f"  [SKIP] Table is empty")
            return {
                "table": table_name,
                "total_expectations": 0,
                "passed": 0,
                "failed": 0,
                "success_rate": 100,
                "details": [],
                "validated_at": datetime.now().isoformat(),
                "note": "Table is empty"
            }

        # Get expectations for this table
        expectations_map = {
            "User": self.create_user_expectations,
            "Profile": self.create_profile_expectations,
            "ScreeningResult": self.create_screening_expectations,
        }

        exp_func = expectations_map.get(table_name)
        if not exp_func:
            print(f"  [SKIP] No expectations defined for {table_name}")
            return {
                "table": table_name,
                "note": "No expectations defined",
                "success_rate": 100,
                "validated_at": datetime.now().isoformat()
            }

        expectations = exp_func()
        print(f"  Running {len(expectations)} expectations...")

        # Run validation
        result = self.run_expectations_gx(df, expectations, table_name)

        # Print summary
        status = "PASS" if result["success_rate"] >= 90 else "FAIL"
        print(f"  Result: {status} ({result['passed']}/{result['total_expectations']} passed)")

        if self.verbose and result.get("details"):
            for detail in result["details"]:
                icon = "[OK]" if detail["success"] else "[X]"
                print(f"    {icon} {detail['expectation']}: {detail['details']}")

        self.results.append(result)
        return result

    async def validate_all(self) -> Dict[str, Any]:
        """
        Run validation on all configured tables.

        Returns:
            Summary of all validations
        """
        tables = ["User", "Profile", "ScreeningResult"]

        for table in tables:
            await self.validate_table(table)

        # Calculate overall summary
        total_passed = sum(r.get("passed", 0) for r in self.results)
        total_failed = sum(r.get("failed", 0) for r in self.results)
        total_expectations = sum(r.get("total_expectations", 0) for r in self.results)

        return {
            "summary": {
                "tables_validated": len(self.results),
                "total_expectations": total_expectations,
                "total_passed": total_passed,
                "total_failed": total_failed,
                "overall_success_rate": round((total_passed / max(total_expectations, 1)) * 100, 1),
                "validated_at": datetime.now().isoformat(),
            },
            "results": self.results
        }

    def print_summary(self, summary: Dict[str, Any]):
        """Print a formatted summary of validation results."""
        print("\n" + "=" * 60)
        print("  GREAT EXPECTATIONS VALIDATION SUMMARY")
        print("=" * 60)

        s = summary.get("summary", {})
        print(f"""
  Tables Validated:     {s.get('tables_validated', 0)}
  Total Expectations:   {s.get('total_expectations', 0)}
  Passed:               {s.get('total_passed', 0)}
  Failed:               {s.get('total_failed', 0)}
  Overall Success Rate: {s.get('overall_success_rate', 0)}%

  Engine: {'Great Expectations' if GX_AVAILABLE else 'Native Pandas (Fallback)'}
""")

        # Status message
        rate = s.get('overall_success_rate', 0)
        if rate >= 95:
            status = "EXCELLENT - All critical checks passing"
        elif rate >= 80:
            status = "GOOD - Minor issues detected"
        else:
            status = "ATTENTION NEEDED - Review failed expectations"

        print(f"  Status: {status}")
        print("=" * 60)


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Run Great Expectations data validation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_standard_checks.py              # Validate all tables
  python run_standard_checks.py --table User # Validate specific table
  python run_standard_checks.py --verbose    # Show detailed results
        """
    )
    parser.add_argument(
        "--table",
        help="Specific table to validate (default: all)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed expectation results"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("  NeuroKid Great Expectations Validation Suite")
    print("=" * 60)

    if not GX_AVAILABLE:
        print("\n[INFO] Great Expectations not installed.")
        print("       Using native pandas validation as fallback.")
        print("       Install with: pip install great_expectations")

    validator = StandardDataValidator(verbose=args.verbose)

    try:
        if args.table:
            result = await validator.validate_table(args.table)
            print(f"\n  Success Rate: {result.get('success_rate', 0)}%")
        else:
            summary = await validator.validate_all()
            validator.print_summary(summary)

    except Exception as e:
        print(f"\n[ERROR] Validation failed: {e}")
        print("\nTip: Ensure DATABASE_URL is set in your .env file")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
