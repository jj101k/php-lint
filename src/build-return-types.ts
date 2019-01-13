const fs = require("fs")
const zlib = require("zlib")
const data = fs.readFileSync("data-in/php-bigxhtml.html", "utf8")
const parts = data.split(/^<hr/m)

function parse_method_structure(method_structure: string): {modifier: string | null, type: string, name: string} {
	const modifier = /(?:\s*<span class="modifier">(?:[\w\s]+)<\/span>)*/
	const type_expr = /(?:([\w|\\?]+)|<span class="type [^"]+">([^<]+)<\/span>|<a[^>]*>(\w+)<\/a>)/
	const method_name = /<span class="methodname">(?:<span[^>]*>([\w:\\-]+)<\/span>|<strong>([\w:\\-]+)<\/strong>|<a[^>]*>([\w:\\-]+)<\/a>)<\/span>/
	const all = new RegExp(`^(${modifier.source})?\\s*(?:<span class="type">${type_expr.source}<\/span>)?\\s*${method_name.source}`)
	let md
	if(md = method_structure.match(all)) {
		return {
			modifier: md[1] ?
				md[1].replace(/<[^>]*>/g, "").replace(/^\s+/, "").replace(/\s+$/, '"') :
				null,
			type: md[2] || md[3] || md[4],
			name: md[5] || md[6] || md[7],
		}
	} else {
		throw new Error(`Cannot parse: ${method_structure}`)
	}
}
function parse_return_info(return_info: string, name: string): {orNull: boolean | null, orFalse: boolean | null} {
	let or_false = null
	let or_null = null
	let md
	if(md = return_info.match(/<p class="(?:sim)?para">([^]*)(?:<\/p>)?/)) {
		const text_content = md[1].replace(/<[^>]*>/g, "").replace(/\n/, " ").replace(/ {2,}/g, " ")
		if(text_content.match(/\bor NULL\b/i)) {
			or_null = true
		}
		if(text_content.match(/\bor false\b/i)) {
			or_false = true
		}
	} else if(md = return_info.match(/<table/)) {
		// Nope
	} else {
		throw new Error(`Cannot parse (${name}): ${return_info}`)
	}
	return {
		orFalse: or_false,
		orNull: or_null,
	}
}
const return_types: {[name: string]: string[]} = {}
for(const part of parts) {
	let md
	if(md = part.match(/<div class="methodsynopsis[^>]*>([^]*?)<\/div>/)) {
		const structure = parse_method_structure(md[1])
		if(md = part.match(/^(\s*)<div class="refsect1 returnvalues"[^>]*>([^]*?)^\1<\/div>/m)) {
			const return_info = parse_return_info(md[2], structure.name)
			const types = [structure.type]
			if(return_info.orFalse) {
				types.push("false")
			}
			if(return_info.orNull) {
				types.push("null")
			}
			if(types.length > 1) {
				return_types[structure.name] = types
			}
		}
	}
}
fs.writeFileSync(
    "data/php-return-types.json.gz",
    zlib.gzipSync(JSON.stringify(return_types), "utf8")
)