"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const TJS = __importStar(require("typescript-json-schema"));
const util_1 = __importDefault(require("util"));
const node_gzip_1 = require("node-gzip");
const request_1 = __importDefault(require("request"));
const configURL = "https://raw.githubusercontent.com/huhisoftware/SpeedReader/master/";
const configFile = "data/SpeedReaderConfig.json";
const outputFile = "data/speedreader-updater.dat";
const readFile = util_1.default.promisify(fs_1.default.readFile);
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
const validate = (schema, data) => {
    const ajv = new ajv_1.default({
        allErrors: true,
        nullable: true,
        coerceTypes: true,
        removeAdditional: true,
    });
    const valid = ajv.validate(schema, data);
    const errorText = ajv.errorsText() && ajv.errorsText().toLowerCase() !== "no errors"
        ? ajv.errorsText()
        : "";
    return {
        errorText,
        valid: !!valid
    };
};
const getSchema = () => {
    const settings = {
        required: true,
        topRef: true,
    };
    const compilerOptions = {
        strictNullChecks: true // Make values non-nullable by default
    };
    const program = TJS.getProgramFromFiles([path_1.resolve("src/types/SpeedReaderConfig.d.ts")], compilerOptions);
    const generator = TJS.buildGenerator(program, settings);
    const schema = generator.getSchemaForSymbol("SpeedReader.Configuration");
    return schema;
};
const downloadConfig = (url, file) => {
    return new Promise(function (resolve, reject) {
        request_1.default(url + file, function (err, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (err)
                return reject(err);
            try {
                resolve(JSON.parse(body));
            }
            catch (e) {
                reject(e);
            }
        });
    });
};
downloadConfig(configURL, configFile)
    .then((config) => {
    const validated = validate(getSchema(), config);
    if (!validated.valid) {
        throw TypeError("The configuration does not match expected format: " + validated.errorText);
    }
    return config;
})
    .then((config) => {
    return node_gzip_1.gzip(JSON.stringify(config));
})
    .then((compressed) => {
    return writeFile(outputFile, compressed);
})
    .then(() => {
    console.log("Serialized");
})
    .catch((error) => {
    console.log("Error: ", error);
    process.exit(1);
});
//# sourceMappingURL=generate-dat.js.map