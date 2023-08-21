function Markup(ITERATION_LIMIT = 100) {
    function applyHeading(line) {
        if (line.match(/^#{1,}/)) {
            var level = 0
            for (let i = 0; i < 7; i++) {
                if (line.charAt(i) !== '#') break
                level = i + 1
            }

            level = Math.min(6, level)

            line = '<h' + level + '>' + line.substring(level, line.length) + '</h' + level + '>'
        }

        return line
    }

    function applyStartingBy(prefix, change, line) {
        if (line.startsWith(prefix)) {
            line = line.substring(prefix.length, line.length)
            line = change(line)
        }
        return line
    }

    function applyComment(line) {
        return applyStartingBy('//', (line) => {
            return ''
        }, line)
    }
    
    function applyList(line) {
        return applyStartingBy('-', (line) => {
            return '<li>'+line.trim()+'</li>'
        }, line)
    }

    function applyParagraph(line) {
        return applyStartingBy('  ', (line) => {
            return '<p>' + line.trim() + '</p>'
        }, line)
    }

    function applyHorizontalRow(line) {
        return applyStartingBy('====', (line) => {
            return '<hr/>'
        }, line)
    }

    function applyDoubleSurround(surroundA, surroundB, process, line) {
        var start
        var end = 0
        var i = 0
        
        while (i++ < ITERATION_LIMIT && (start = line.indexOf(surroundA, end)) >= 0) {
            end = line.indexOf(surroundB, start + surroundA.length)
            if (end < 0) return line

            line = line.substring(0, start) + process(line.substring(start + surroundA.length, end)) + line.substring(end + surroundB.length, line.length)
        }

        return line
    }
    
    function applySurround(surround, tag, line) {
        return applyDoubleSurround(surround, surround, (raw) => {
            return line = '<'+tag+'>' + raw + '</'+tag+'>'
        }, line)
    }
    
    function applyItalic(line) {
        return applySurround('**', 'em', line)
    }
    
    function applyBold(line) {
        return applySurround('*', 'strong', line)
    }
    
    function applyStrike(line) {
        return applySurround('--', 'strike', line)
    }
    
    function applyUnderline(line) {
        return applySurround('__', 'u', line)
    }
    
    function applyMark(line) {
        return applySurround('::', 'mark', line)
    }
    
    function applyMono(line) {
        return applySurround(';;', 'pre', line)
    }
    
    function applyQuote(line) {
        return applySurround("''", 'q', line)
    }
    
    function applyBlockQuote(line) {
        return applySurround('""', 'blockquote', line)
    }
    
    function applyABResource(loadResource, line) { // (A)[B]  Ex: (link)[https://url.com]
        return applyDoubleSurround('(', ']', (raw) => {
            // raw = A)[B
            const A = raw.substring(0, raw.indexOf(')'))
            const B = raw.substring(raw.indexOf('[')+1, raw.length)
            return loadResource(A, B)
        }, line)
    }
    
    function applyResources(line) {
        return applyABResource((A, B) => {
            if (B.startsWith('!')) {
                B = B.substring(1, B.length)
                if (B.match(/(https?:\/\/[^\s]+)|([^\s]+)/g)) {
                    return '<img alt="' + A + '" src="' + B + '"/>'
                }
            }
        
            if (A == 'css') {
                if (B.match(/(https?:\/\/[^\s]+)|([^\s]+)/g)) {
                    return '<link rel="stylesheet" href="' + B + '"/>'
                }
            }
        
            if (B.match(/(https?:\/\/[^\s]+)|([^\s]+)/g)) {
                return '<a href="' + B + '">' + A + '</a>'
            }
        
            return line
        }, line)
    }
    
    function applySymbols(input) {
        const SYMBOL = 0
        const VALUE = 1
        
        const symbols = [
            ['&italic;', '**'],
            ['&bold;', '*'],
            ['&strike;', '--'],
            ['&underline;', '__'],
            ['&mark;', '::'],
            ['&mono;', ';;'],
            ['&quote;', "''"],
            ['&bquote;', '""'],
            ['&par;', '('],
            ['&bra;', '['],
        ]
        
        for (const sym of symbols) {
            input = input.replaceAll(sym[SYMBOL], sym[VALUE])
        }
        
        return input
    }
    
    function parseMarkup(source) {
        var html = ''
        
        source = source.replaceAll(String.fromCharCode(160), String.fromCharCode(32)) // Convert space 160 to 32 char code
        
        for (var line of source.split('\n')) {
            line = applyHeading(line)
            line = applyComment(line)
            line = applyList(line)
            line = applyParagraph(line)
            line = applyHorizontalRow(line)
            line = applyItalic(line)
            line = applyBold(line)
            line = applyStrike(line)
            line = applyUnderline(line)
            line = applyMark(line)
            line = applyMono(line)
            line = applyQuote(line)
            line = applyBlockQuote(line)
            line = applyResources(line)
            html += line
        }
        
        html = applySymbols(html)
    
        return '<markup>' + html + '</markup>'
    }
    
    function parseMarkupFile(url) {
        return fetch(url)
        .then(data => data.text())
        .then(fileContent => {
            return parseMarkup(fileContent)
        })
    }
    
    return {
        parseMarkup,
        parseMarkupFile
    }
}