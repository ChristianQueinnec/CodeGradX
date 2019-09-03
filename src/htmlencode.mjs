// htmlencode.mjs
// Time-stamp: "2019-05-21 14:38:52 queinnec"

const special = {
    "'": "&apos;",
    '"': "&quot;",
    '<': "&lt;",
    '>': "&gt;",
    '&': "&amp;"
};

export function htmlencode (text) {
    let htmltext = '';
    const letters = text.split('');
    for ( let i=0 ; i<letters.length ; i++ ) {
        const ch = letters[i];
        if ( special[ch] ) {
            htmltext += special[ch];
        } else {
            htmltext += ch;
        }
    }
    return htmltext;
}

// end of htmlencode.mjs
