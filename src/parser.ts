export function parseHTML(html: string) {
    console.log(html);

    let i = 0;
    let c = "";
    let tag = "";
    let readingTag = false;
    let readingAttribute = false;
    let attributeName = "";
    let attributeValue = "";
    let readStartQuote = false;
    let attributes = [];
    let readStart = false;
    let start = 0;
    let end = 0;

    for (i = 0; i < html.length; i++) {
        c = html[i];

        
        if (c === "<" && !readingAttribute) {
            readingTag = true;
            readStart = true;
        } else if (!readStart){

        }
        
        else if((c === ' ' || c === '>') && readingTag) {
            readingTag = false;
            console.log(tag);
            tag = "";
        } else if (readingTag) {
            tag += c;
        } else if(c === "=" && !readingAttribute) {
            readingAttribute = true;


        }
        else 
        if(readingAttribute) {
            if(c === '"' && !readStartQuote) {
                readStartQuote = true;
                start = i + 1;
            } else if (c === '"' && readStartQuote) {
                readingAttribute = false;
                end = i;
                readStartQuote = false;

                attributes.push({name: attributeName, value: attributeValue, start: start, end: end});

                attributeName = "";
                attributeValue = "";
            } else {
                attributeValue += c;
            }

        }
       
        else if(c !== " " && c !== ">" ){
            attributeName += c;
        } else if(c === '>' ) {
            console.log("End of tag");
            return attributes;
        }

        





    }
}

function removeWhitespace(html: string) {
    let i = 0;
    let reachedStart = false;
    let cleanedHTML = "";
    while (i < html.length) {
        if (html[i] === "<") {
        reachedStart = true;
        }
        if (reachedStart) {
        cleanedHTML += html[i];
        }
        i++;
    }
    return cleanedHTML;
}

console.log(parseHTML("   <div id=\"swfewfwefewfwef\"class=\"2cdcdcefefe\">"));