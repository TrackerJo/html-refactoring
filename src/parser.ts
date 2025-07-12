import { parsedAttribute } from "./extension";


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
    let attributes: parsedAttribute[] = [];
    let readStart = false;
    let start = 0;
    let end = 0;

    for (i = 0; i < html.length; i++) {
        c = html[i];


        if (c === "<" && !readingAttribute) {
            readingTag = true;
            readStart = true;
        } else if (!readStart) {

        }

        else if ((c === ' ' || c === '>') && readingTag) {
            readingTag = false;
            console.log(tag);
            tag = "";
        } else if (readingTag) {
            tag += c;
        } else if (c === "=" && !readingAttribute) {
            readingAttribute = true;


        }
        else
            if (readingAttribute) {
                if (c === '"' && !readStartQuote) {
                    readStartQuote = true;
                    start = i + 1;
                } else if (c === '"' && readStartQuote) {
                    readingAttribute = false;
                    end = i;
                    readStartQuote = false;

                    attributes.push({ name: attributeName, value: attributeValue, start: start, end: end });

                    attributeName = "";
                    attributeValue = "";
                } else {
                    attributeValue += c;
                }

            }

            else if (c !== " " && c !== ">") {
                attributeName += c;
            } else if (c === '>') {
                console.log("End of tag");
                return attributes;
            }







    }

    return attributes;
}

export function parseCSS(css: string) {

    let c = "";
    let cString = "";
    let readingID = false;
    let readingClass = false;
    let readingOther = false;
    let readingQuotes = false;
    let isLine = false;

    let attributes: parsedAttribute[] = [];


    for (let i = 0; i < css.length; i++) {
        c = css[i];
        if (c === "." && !readingQuotes) {
            if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
                readingID = false;
            } else if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";

            } else {
                readingClass = true;
                cString = "";
            }

        } else if (c === "#" && !readingQuotes) {
            if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";
                readingClass = false;
            } else if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
            } else {
                readingID = true;
                cString = "";
            }
        } else if (c === " " && !readingQuotes) {
            if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
                readingID = false;
            } else if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";
                readingClass = false;
            } else {
                cString = "";
            }
        } else if (c === '"') {
            if (readingQuotes) {
                readingQuotes = false;
            } else {
                readingQuotes = true;
            }
        } else if (c === ":" && !readingQuotes) {
            if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
                readingID = false;
            } else if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";
                readingClass = false;
            } else {
                cString = "";
            }
        } else if (c === "[" && !readingQuotes) {
            if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
                readingID = false;
            } else if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";
                readingClass = false;
            } else {
                cString = "";
            }
        } else if (c === "{" && !readingQuotes) {
            if (readingID) {
                let idData = {
                    name: "id",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(idData);
                cString = "";
                readingID = false;
            } else if (readingClass) {
                let classData = {
                    name: "class",
                    value: cString,
                    start: i - cString.length,
                    end: i
                };
                attributes.push(classData);
                cString = "";
                readingClass = false;
            } else {
                cString = "";
            }
        } else if (c === ";") {
            isLine = true;
            readingID = false;
            readingClass = false;
            break;

        }
        else {
            cString += c;
        }
    }
    if (readingID) {
        let idData = {
            name: "id",
            value: cString,
            start: css.length - cString.length,
            end: css.length
        };
        attributes.push(idData);
        cString = "";
        readingID = false;
    }
    if (readingClass) {
        let classData = {
            name: "class",
            value: cString,
            start: css.length - cString.length,
            end: css.length
        };
        attributes.push(classData);
        cString = "";
        readingClass = false;
    }

    return attributes;
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

console.log(parseCSS(".test"));