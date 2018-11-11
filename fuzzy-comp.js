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

    // Character map for determining X position (itx of character in string)
    // and Y position (map element).
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
    var max_score_difference = 2;
    var max_missing_characters = 1;

    // Convert strings to lower case
    a = a.toLowerCase();
    b = b.toLowerCase();

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

            // See docs bolow for exaplanation
            var denom = a_map[x][y][z].map(obj => 1 / Math.pow(2, Math.abs(obj.z - z))).reduce((a, b) => a + b, 0);

            a_map[x][y][z].forEach(function (mapped_char) {
                // Onl allow characters to have a maximum score
                // of 1.
                // if (mapped_char.score < 1) {
                // Calculate difference in xy and z values, based on
                // original character location
                var diff_xy = Math.max(Math.abs(x - mapped_char.x), Math.abs(y - mapped_char.y)) 
                var diff_z = Math.abs(z - mapped_char.z);

                // The score to add will be a fraction of how accurate the character match is.
                // Increase the score by a fraction  of the number of elements in
                // the map.
                // If there's a difference in xy or z, the score will be decreased....
                // The numerator, is by default 1, however, for each xy or z position away
                // divide by 2, i.e. 1 / (2 ^ number of positions away)
                // The denominator is the maximum score that we expect this object
                // can have, i.e. each object in the object map will be triggered by this
                // character. The denominator must make the total score across all objects
                // that is being added by this loop to, represent 1.
                // Since we are expecting map.length number of hits, and each once
                // will provide a value of 1 / (2 ^ n positions away), the actual character
                // a z will provide 1/denom, the characters either side will provide x/denom.
                // The number of characters either side is determined by the length of the map array.
                // Number of side characters (array length / 2) plus 1 for the current position.
                // NOTE due to floating point errors,
                // dividing is moved to results section! (not any more)
                var numerator = (1 / Math.pow(2, diff_xy + diff_z));
                mapped_char.scores.push([numerator, denom]);
            });
        } else {
            b_unfound.push(character);
        }
    });

    // Iterate character objects from a
    var a_unfound = [];
    var scores = [];
    var total_score = 0;
    var min_denom = null;

    a_map['all'].forEach(function (a_obj) {
        // If the character has a score of 0,
        // then it was not found at all and add
        // to list of not found a characters
        if (a_obj.scores.length == 0) {
            a_unfound.push(a_obj);

        // Otherwise, process score
        } else {
            // Increment total found objects
            a_obj.scores.forEach(function(score){
                scores.push(score);
                if (min_denom == null) {
                    min_denom = score[1];
                } else {
                    min_denom = Math.min(min_denom, score[1]);
                }
            });
        }
    });

    // Iterate through all scores,
    // Determine lowest common multiple for the denominator
    var score_numerator = 0;
    var score_denominator = 1;
    scores.forEach(function(score) {
        // Calculate score denominator across all scores.
        score_denominator = calc_lowest_multiple(score_denominator, score[1]);
    });
    scores.forEach(function(score) {
        // Calculate numerator for single score and add to total enumerator
        score_numerator += (score[0] * score_denominator / score[1])
    });
    console.log(score_numerator);
    console.log(score_denominator);
    // If score denominator does not equal 0,
    // Avoid devide zero #CaughtBeforeTesting
    if (score_denominator != 0) {
        total_score = score_numerator / score_denominator;
    }
    return (total_score >= (max_score - max_score_difference));
}

/* Fuzzy character used for storing original
 * information about a character
 */
function fuzzy_char(char, x, y, z) {
    // Store actual character
    this.char = char;

    // Store actual x, y, z co-ordinates
    this.x = x;
    this.y = y;
    this.z = z;

    // Store list of scores
    this.scores = [];

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

/* Calculate greates common dividor */
function gcd(a, b) {
    return !b ? a : gcd(b, a % b);
}
/* Calculate lowest common multiple */
function calc_lowest_multiple(a, b) {
    return (a * b) / gcd(a, b);
}
