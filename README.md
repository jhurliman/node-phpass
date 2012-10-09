# Node phpass #

A pure node.js JavaScript port of the portable PHP password hashing framework. 
The goal is to support existing password hashes created with the phpass library 
and to generate new hashes that can be used with phpass.

## Installation ##

Use NPM to install:

    npm install phpass

## Usage ##

    var PasswordHash = require('phpass').PasswordHash;
    var passwordHash = new PasswordHash();
    var password = 'abc123';
    var hash = passwordHash.hashPassword(password);
    var success = passwordHash.checkPassword(password, hash);

## Sponsors ##

* [cull.tv](http://cull.tv/) - New music television

## Changelog ##

**0.1.1** - Fixed a crash when initializing PasswordHash with no parameters

**0.1.0** - Initial release

## License ##

Uses code from the [jsBCrypt](http://code.google.com/p/javascript-bcrypt/) 
project, which is released under the 
[New BSD License](http://www.opensource.org/licenses/bsd-license.php).

(The MIT License)

Copyright (c) 2011 Cull TV, Inc. &lt;jhurliman@cull.tv&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
