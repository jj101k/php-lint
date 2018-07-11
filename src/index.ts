import * as phpParser from "php-parser"
const parser = new phpParser.default({
    parser: {
        debug: false,
        extractDoc: true,
    },
    ast: {
        withPositions: true,
    },
})
export {default} from "./php-lint"