0.3.1
-----

- Support silencing mispelled (documented) core type errors
- Correct type detection when misspelled
- Improved support for arrays (indexed and associative)
- Improve parsing of complex type expressions in PHPDoc
- Improve error messages
- Added some common PHP function return types
- Support silencing errors in vendor directories
- Type discovery is improved
- Documentation defaults to mixed when no type is mentioned
- Property documentation is now parsed
- Internal: Origins of "mixed" are now tracked
- Offset-lookup and foreach now recognise the inner types
- Resolution of types where there may be inter-class recursion is improved
- More common PHP function return types added
- Understanding of `$this` improved across superclasses and traits
- `__set()` is now recognised as a possible way that an unrecognised property may
  be settable
- Fixed class name parsing in docs for namespaced classes

0.3.0
-----

- Initial testing release