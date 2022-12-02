# Open Product Recovery Core Test Utilities

This package provides skeleton test suites and supporting libraries for testing
implementations of opr-core interfaces. These packages are intended to ensure
that all new integrations have the same behavior.

For example, implementors that create a new persistentstorage implementation can
create a data-driven test using database/persistenttestconfig.ts. This test will
ensure that the new implementation has exactly the same behavior as the existing
implementations.
