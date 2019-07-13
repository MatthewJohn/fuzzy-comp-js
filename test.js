

var fs = require("fs")
var vm = require('vm')

var content = fs.readFileSync('fuzzy-comp.js');
vm.runInThisContext(content)

// Checks
compare_string('and', 'and') || (() => { throw ""; })();
compare_string('and', 'andp') || (() => { throw ""; })();
compare_string('and', 'qand') || (() => { throw ""; })();
compare_string('and', 'an') || (() => { throw ""; })();
compare_string('and', 'nd') && (() => { throw ""; })();
compare_string('and', 'qnd') || (() => { throw ""; })();
compare_string('and', '') && (() => { throw ""; })();
compare_string('and', 'or') && (() => { throw ""; })();
compare_string('and', 'ar') && (() => { throw ""; })();

compare_string('or', 'or') || (() => { throw ""; })();
compare_string('or', 'r') && (() => { throw ""; })();
compare_string('or', 'o') && (() => { throw ""; })();
compare_string('or', 'oe') || (() => { throw ""; })();
compare_string('or', 'op') && (() => { throw ""; })();
compare_string('or', 'and') && (() => { throw ""; })();
compare_string('or', 'nb') && (() => { throw ""; })();
compare_string('or', 'er') || (() => { throw ""; })();
compare_string('abcdefg', 'asdfgggg');

