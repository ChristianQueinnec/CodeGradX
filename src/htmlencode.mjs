// htmlencode.mjs
// Time-stamp: "2021-03-10 18:40:22 queinnec"

const special = {
    "'": "&apos;",
    '"': "&quot;",
    '<': "&lt;",
    '>': "&gt;",
    '&': "&amp;"
};

export function htmlencode (text='') {
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
