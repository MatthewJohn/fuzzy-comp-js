// Fuzzy Comp JS
// Copyright (c) 2018 - Matt Comben <matthew@dockstudios.co.uk>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* Compare two string and perform a fake fuzzy search */
function compare_string(a, b) {
    // This operation works in a multi-dimensional comparison,
    // we assign each letter of the string the value of it's:
    // x - x axis on keyabord (scale of 0-11)
    // y - y axis on keyboard (0-3)
    // z - location in the string (0-length of string)
    // Each of the above have the same weight, since
    // it is just as likely to accidently hit a key above or
    // below the expected one, as it is to hit the key
    // to the left or right, or to type two charcters in the wrong
    // order.
    // Missing characters will be given a 'difference' of 3^(n-1)
    // (n = number of missing characters), since 1 missing
    // character seems likely, but more
    // than one should quickly decrease the match.
    // The characters in a will be pushed into an array with, as well as
    // all of the allowed difference

    var maps = ['\\zxcvbnm,./', 'asdfghjkl;\'#', 'qwertyuiop[]', '1234567890-='];

    // Maximum axis offset for a valid character
    var max_offset = 1;
    // Maximum score difference before character is treated as
    // different.
    // Scores are:  - 1 devided by number of character offset placement
    //                up to maximum of max_offset.
    //                e.g. if 2 characters are switched by 1 place, the
    //                score difference would be 1.
    //              - A missing character would count 1 (either misssing from a or b)
    var max_score_difference = 1;

    // Maximum score is based on total number of characters (either a or b)
    // since missing characters in a or b will result in a decreased score.
    var max_score = Math.max(a.length, b.length);

    // Map for storing lookup of character objects for a
    var a_map = {
        // List of all objects
        'all': []
    };
    a.split('').forEach(function(character, char_itx) {
        var x = null;
        var y = null;
        var z = char_itx;

        // Find the x and y axis by iterating through each map.
        maps.forEach(function(map, y_itx) {
            var x_index = map.indexOf(character);
            if (x_index != -1) {
                y = y_itx;
                x = x_index;
            }
        });

        // If the x,y dimensions could not be found, return
        if (x == null || y == null) {
            // @TODO conform with whatever return
            // is used at end of the function
            return 0;
        }
        // Insert character into fuzzy map
        insert_fuzzy(a_map, character, x, y, z, max_offset);
    });

    // Initialise array for B characters that were not found
    // in a
    var b_unfound = [];

    // Iterate through B, looking for each item in the map
    b.split('').forEach(function(character, char_itx) {
        var x = null;
        var y = null;
        var z = char_itx;

        // Find the x and y axis by iterating through each map.
        maps.forEach(function(map, y_itx) {
            var x_index = map.indexOf(character);
            if (x_index != -1) {
                y = y_itx;
                x = x_index;
            }
        });

        // If the x,y dimensions could not be found, return
        if (x == null || y == null) {
            // @TODO conform with whatever return
            // is used at end of the function
            return 0;
        }
        // Add score to each found element
        if (x in a_map && y in a_map[x] && z in a_map[x][y]) {
            a_map[x][y][z].forEach(function (mapped_char) {
                // Onl allow characters to have a maximum score
                // of 1.
                if (mapped_char.score < 1) {
                    // Calculate difference in xy and z values, based on
                    // original character location
                    var diff_xy = Math.max(Math.abs(x - mapped_char.x), Math.abs(y - mapped_char.y)) 
                    var diff_z = Math.abs(z - mapped_char.z);

                    // The score to add will be a fraction of how accurate the character match is.
                    // Increase the score by a fraction  of the number of elements in
                    // the map.
                    // If there's a difference in xy or z, the score will be decreased.
                    // NOTE due to floating point errors,
                    // dividing is moved to results section! (not any more)
                    mapped_char.score += (1 / Math.abs(1 + diff_xy + diff_z)) / a_map[x][y][z].length;
                    console.log(mapped_char);
                    // console.log(a_map[x][y][z]);
                    // console.log(mapped_char.score);

                    //mapped_char.score_fraction_denominator += a_map[x][y][z].length;
                    //console.log('found character');
                }
            });
        } else {
            b_unfound.push(character);
        }
    });

    // Iterate character objects from a
    var a_unfound = [];
    var total_score = 0;
    //var total_denominator = 0;

    a_map['all'].forEach(function (a_obj) {
        // If the character has a score of 0,
        // then it was not found at all and add
        // to list of not found a characters
        if (a_obj.score == 0) {
            a_unfound.push(a_obj);

        // Otherwise, process score
        } else {
            // Increment total found objects
            total_score += a_obj.score;
            // Add object score to total score
            //total_denominator += a_obj.score_fraction_denominator;
        }
    });

    // Avoid devide zero #CaughtBeforeTesting
    //var found_characters = 0;
    // if (total_score > 0) {
    //     // @TODO should this be floor?
    //     //found_characters = Math.floor(total_score / total_denominator);
    //     console.log(total_score);
    //     found_characters = Math.floor(total_score);
    // }
    console.log('found characters: ' + total_score);

    // Determine number of mising characters
    // Since a missed 'a' character could match up
    // with a missed 'b' character (or just completely wrong),
    // use the max of the two numbers
    var missing_characters = Math.max(a_unfound.length, b_unfound.length);
    total_score -= missing_characters;
    console.log('Missing: ' + missing_characters);
    console.log('total score: ' + total_score);
    console.log('Max score: ' + max_score)

    console.log('Passed: ' + (total_score >= (max_score - max_score_difference)))
}

/* Fuzzy character used for storing original
 * information about a character
 */
function fuzzy_char(char, x, y, z) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.z = z;
    this.score = 0;
    //this.score_fraction_denominator = 0;
    return this;
}

/* Create charcter object and insert into the character map in
 * it's aboluste location, as well as fuzz locations, depermined
 * by the max_offset
 */
function insert_fuzzy(map, char, x, y, z, max_offset) {
    // Create character object
    char_obj = new fuzzy_char(char, x, y, z);

    // Store object in list of all objects
    map['all'].push(char_obj);

    // Iterate through x values (max_offset above/bove x)
    for (let x_itx = (x - max_offset);
            x_itx <= (x + max_offset);
            x_itx ++) {
        // If x offset does not exist in map, create an empty dictionary
        if (!(x_itx in map)) {
            map[x_itx] = {};
        }
        // Iterate through y values (max_offset above/bove y)
        for (let y_itx = (y - max_offset);
                y_itx <= (y + max_offset);
                y_itx ++) {
            // If y offset does not exist in map, create an empty dictionary
            if (!(y_itx in map[x_itx])) {
                map[x_itx][y_itx] = {};
            }
            // Iterate through z values (max_offset above/bove z)
            for (let z_itx = (z - max_offset);
                    z_itx <= (z + max_offset);
                    z_itx ++) {
                // If x offset does not exist in map, create an empty dictionary
                if (!(z_itx in map[x_itx][y_itx])) {
                    map[x_itx][y_itx][z_itx] = [];
                }
                // Add character object to the dict
                map[x_itx][y_itx][z_itx].push(char_obj);
            }
        }
    }
}

//compare_string('and', 'anf');
compare_string('aaa', 'aaa');
