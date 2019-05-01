# CodeGradX

This is a new version of the CodeGradX library, a browser-side
JavaScript library to interact with the CodeGradX infrastructure. The
CodeGradX infrastructure provides mechanically grading facilities:
- students may submit answers to programming exercises, 
- authors may submit new programming exercises, 
- teachers may monitor the progress of their students.

The library uses WebModules, Promises and the fetch API. WebModules
are dynamically loaded whenever imported thus lessening the size of
the core library. The library is also mostly free of other dependencies
(bluebird, he, lodash are no longer required). However contrarily to
the previous libraries such as
https://github.com/ChristianQueinnec/CodeGradXlib, the present library
can only be operated on the browser side.

# Installation

``` shell
npm install codegradx
```

