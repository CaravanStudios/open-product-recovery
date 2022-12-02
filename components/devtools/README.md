# Open Product Recovery Developer Tools

Development tools used across the Open Product Recovery reference
implementations. This package contains three major libraries:

1. Sourced JSON - Code for parsing JSON files while retaining source information
1. JSON Resolver - A templating system for sourced JSON files that allow
    templates to be composed and modified with directives like `$import` and
    `$patch`.
1. Data Driven Test - A data-driven testing system that allows unit tests to be
    specified using sourced JSON templates.

See the tests/ directory for extensive examples on the use of these libraries.
