import { u128, u128Safe, u256, u256Safe, i128, i128Safe, i256Safe } from "as-bignum/assembly";
import { StringSink } from "as-string-sink/assembly";
import { isSpace } from "util/string";
import {
    backSlashCode,
    commaCode,
    commaWord,
    eCode,
    fCode,
    leftBraceCode,
    leftBracketCode,
    leftBracketWord,
    nCode,
    nullWord,
    quoteCode,
    rCode,
    rightBraceCode,
    rightBracketCode,
    rightBracketWord,
    tCode,
    trueWord,
    uCode,
    emptyArrayWord
} from "./chars";
import { isBigNum, unsafeCharCodeAt } from "./util";

/**
 * JSON Encoder/Decoder for AssemblyScript
 */
export namespace JSON {
    /**
     * Stringifies valid JSON data.
     * ```js
     * JSON.stringify<T>(data)
     * ```
     * @param data T
     * @returns string
     */
    export function stringify<T>(data: T): string {
        // String
        if (isString<T>()) {
            return '"' + (<string>data).replaceAll('"', '\\"') + '"';
        }
        // Boolean
        else if (isBoolean<T>()) {
            return data ? "true" : "false";
        }
        // Nullable
        else if (isNullable<T>() && data == null) {
            return "null";
        }
        // Integers/Floats
        // @ts-ignore
        else if ((isInteger<T>() || isFloat<T>()) && isFinite(data)) {
            // @ts-ignore
            return data.toString();
        }
        // Class-Based serialization
        // @ts-ignore
        else if (isDefined(data.__JSON_Serialize)) {
            // @ts-ignore
            //if (isNullable<T>()) return "null";
            // @ts-ignore
            return data.__JSON_Serialize();
        }
        // ArrayLike
        else if (isArrayLike<T>()) {
            let result = new StringSink(leftBracketWord);
            // @ts-ignore
            if (data.length == 0) return emptyArrayWord;
            // @ts-ignore
            for (let i = 0; i < data.length - 1; i++) {
                // @ts-ignore
                result.write(JSON.stringify(unchecked(data[i])));
                result.write(commaWord);
            }
            // @ts-ignore
            result.write(JSON.stringify(unchecked(data[data.length - 1])));
            result.write(rightBracketWord);
            return result.toString();
        } else if ((isManaged<T>() || isReference<T>()) && isBigNum<T>()) {
            // @ts-ignore
            return data.toString();
        } else if (data instanceof Date) {
            return data.toISOString();
        } else {
            throw new Error(`Could not serialize data of type ${nameof<T>()}. Invalid data provided.`);
        }
    }
    /**
     * Parses valid JSON strings into their original format.
     * ```js
     * JSON.parse<T>(data)
     * ```
     * @param data string
     * @returns T
     */
    export function parse<T>(data: string): T {
        let type!: T;
        if (isString<T>()) {
            // @ts-ignore
            return parseString(data);
        } else if (isBoolean<T>()) {
            // @ts-ignore
            return parseBoolean<T>(data);
        } else if (isFloat<T>() || isInteger<T>()) {
            return parseNumber<T>(data);
        } else if (isArrayLike<T>()) {
            // @ts-ignore
            return parseArray<T>(data.trimStart());
            // @ts-ignore
        } else if (isNullable<T>() && data == "null") {
            // @ts-ignore
            return null;
            // @ts-ignore
        } else if (isDefined(type.__JSON_Set_Key)) {
            return parseObject<T>(data.trimStart());
        } else if ((isManaged<T>() || isReference<T>()) && isBigNum<T>()) {
            // @ts-ignore
            return parseBigNum<T>(data);
        } else {
            // @ts-ignore
            throw new Error(`Could not deserialize data ${data} to type ${nameof<T>()}. Invalide data provided.`);
        }
    }
    function parseObjectValue<T>(data: string): T {
        let type!: T;
        if (isString<T>()) {
            // @ts-ignore
            return data.replaceAll('\\"', '"');
        } else if (isBoolean<T>()) {
            // @ts-ignore
            return parseBoolean<T>(data);
        } else if (isFloat<T>() || isInteger<T>()) {
            return parseNumber<T>(data);
        } else if (isArrayLike<T>()) {
            // @ts-ignore
            return parseArray<T>(data);
            // @ts-ignore
        } else if (isNullable<T>() && data == "null") {
            // @ts-ignore
            return null;
            // @ts-ignore
        } else if (isDefined(type.__JSON_Set_Key)) {
            // @ts-ignore
            //if (isNullable<T>()) return null;
            return parseObject<T>(data);
        } else if ((isManaged<T>() || isReference<T>()) && isBigNum<T>()) {
            // @ts-ignore
            return parseBigNum<T>(data);
        } else {
            // @ts-ignore
            //return null;
            throw new Error(`Could not deserialize data ${data} to type ${nameof<T>()}. Invalide data provided.`)
        }
    }
    // @ts-ignore
    @unsafe
    export function createObjectUnsafe<T>(): T {
        return changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()))
    }
}

// @ts-ignore
@inline
// @ts-ignore
function parseBigNum<T>(data: string): T {
    // @ts-ignore
    if (idof<T>() == idof<u128>()) return u128.fromString(data);
        // @ts-ignore
    if (idof<T>() == idof<u128Safe>()) return u128Safe.fromString(data);
        // @ts-ignore
    if (idof<T>() == idof<u256>()) return u128Safe.fromString(data);
        // @ts-ignore
    if (idof<T>() == idof<u256Safe>()) return u256Safe.fromString(data);
        // @ts-ignore
    if (idof<T>() == idof<i128>()) return i128.fromString(data);
        // @ts-ignore
    if (idof<T>() == idof<i128Safe>()) return i128Safe.fromString(data);
        // @ts-ignore
    //if (idof<T>() == idof<i256Safe>()) return data.
}

// @ts-ignore
@inline
function parseString(data: string): string {
    return data.slice(1, data.length - 1).replaceAll('\\"', '"');
}

// @ts-ignore
@inline
function parseBoolean<T extends boolean>(data: string): T {
    if (data.length > 3 && data.startsWith("true")) return <T>true;
    else if (data.length > 4 && data.startsWith("false")) return <T>false;
    else throw new Error(`JSON: Cannot parse "${data}" as boolean`);
}

// @ts-ignore
@inline
function parseNumber<T>(data: string): T {
    let type: T;
    // @ts-ignore
    if (type instanceof f64) return F64.parseFloat(data);
    // @ts-ignore
    else if (type instanceof f32) return F32.parseFloat(data);
    // @ts-ignore
    else if (type instanceof u64) return U64.parseInt(data);
    // @ts-ignore
    else if (type instanceof u32) return U32.parseInt(data);
    // @ts-ignore
    else if (type instanceof u8) return U8.parseInt(data);
    // @ts-ignore
    else if (type instanceof u16) return U16.parseInt(data);
    // @ts-ignore
    else if (type instanceof i64) return I64.parseInt(data);
    // @ts-ignore
    else if (type instanceof i32) return I32.parseInt(data);
    // @ts-ignore
    else if (type instanceof i16) return I16.parseInt(data);
    // @ts-ignore
    else if (type instanceof i8) return I8.parseInt(data);

    throw new Error(
        `JSON: Cannot parse invalid data into a number. Either "${data}" is not a valid number, or <${nameof<T>()}> is an invald number type.`
    );
}

// @ts-ignore
@inline
export function parseObject<T>(data: string): T {
    let schema: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
    let key = "";
    let isKey = false;
    let depth = 1;
    let char = 0;
    let outerLoopIndex = 1;
    for (; outerLoopIndex < data.length - 1; outerLoopIndex++) {
        char = unsafeCharCodeAt(data, outerLoopIndex);
        if (char === leftBracketCode) {
            for (
                let arrayValueIndex = outerLoopIndex;
                arrayValueIndex < data.length - 1;
                arrayValueIndex++
            ) {
                char = unsafeCharCodeAt(data, arrayValueIndex);
                if (char === leftBracketCode) {
                    depth = depth << 1;
                } else if (char === rightBracketCode) {
                    depth = depth >> 1;
                    if (depth === 1) {
                        ++arrayValueIndex;
                        // @ts-ignore
                        schema.__JSON_Set_Key(key, data.slice(outerLoopIndex, arrayValueIndex));
                        outerLoopIndex = arrayValueIndex;
                        isKey = false;
                        break;
                    }
                }
            }
        } else if (char === leftBraceCode) {
            for (
                let objectValueIndex = outerLoopIndex;
                objectValueIndex < data.length - 1;
                objectValueIndex++
            ) {
                char = unsafeCharCodeAt(data, objectValueIndex);
                if (char === leftBraceCode) {
                    depth = depth << 1;
                } else if (char === rightBraceCode) {
                    depth = depth >> 1;
                    if (depth === 1) {
                        ++objectValueIndex;
                        // @ts-ignore
                        schema.__JSON_Set_Key(key, data.slice(outerLoopIndex, objectValueIndex));
                        outerLoopIndex = objectValueIndex;
                        isKey = false;
                        break;
                    }
                }
            }
        } else if (char === quoteCode) {
            for (
                let stringValueIndex = ++outerLoopIndex;
                stringValueIndex < data.length - 1;
                stringValueIndex++
            ) {
                char = unsafeCharCodeAt(data, stringValueIndex);
                if (
                    char === quoteCode &&
                    unsafeCharCodeAt(data, stringValueIndex - 1) !== backSlashCode
                ) {
                    if (isKey === false) {
                        key = data.slice(outerLoopIndex, stringValueIndex);
                        isKey = true;
                    } else {
                        // @ts-ignore
                        schema.__JSON_Set_Key(key, data.slice(outerLoopIndex, stringValueIndex));
                        isKey = false;
                    }
                    outerLoopIndex = ++stringValueIndex;
                    break;
                }
            }
        } else if (char == nCode) {
            // @ts-ignore
            schema.__JSON_Set_Key(key, nullWord);
            isKey = false;
        } else if (
            char === tCode &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === rCode &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === uCode &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === eCode
        ) {
            // @ts-ignore
            schema.__JSON_Set_Key(key, trueWord);
            isKey = false;
        } else if (
            char === fCode &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === "a".charCodeAt(0) &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === "l".charCodeAt(0) &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === "s".charCodeAt(0) &&
            unsafeCharCodeAt(data, ++outerLoopIndex) === eCode
        ) {
            // @ts-ignore
            schema.__JSON_Set_Key(key, "false");
            isKey = false;
        } else if ((char >= 48 && char <= 57) || char === 45) {
            let numberValueIndex = ++outerLoopIndex;
            for (; numberValueIndex < data.length; numberValueIndex++) {
                char = unsafeCharCodeAt(data, numberValueIndex);
                if (char === commaCode || char === rightBraceCode || isSpace(char)) {
                    // @ts-ignore
                    schema.__JSON_Set_Key(key, data.slice(outerLoopIndex - 1, numberValueIndex));
                    outerLoopIndex = numberValueIndex;
                    isKey = false;
                    break;
                }
            }
        }
    }
    return schema;
}

// @ts-ignore
@inline
// @ts-ignore
export function parseArray<T extends unknown[]>(data: string): T {
    let type!: valueof<T>;
    if (type instanceof String) {
        return <T>parseStringArray(data);
    } else if (isBoolean<valueof<T>>()) {
        // @ts-ignore
        return parseBooleanArray<T>(data);
    } else if (isFloat<valueof<T>>() || isInteger<valueof<T>>()) {
        // @ts-ignore
        return parseNumberArray<T>(data);
    } else if (isArrayLike<valueof<T>>()) {
        // @ts-ignore
        return parseArrayArray<T>(data);
        // @ts-ignore
    } else if (isDefined(type.__JSON_Set_Key)) {
        // @ts-ignore
        return parseObjectArray<T>(data);
    }
}

// @ts-ignore
@inline
export function parseStringArray(data: string): string[] {
    const result: string[] = [];
    let lastPos = 0;
    let instr = false;
    for (let i = 1; i < data.length - 1; i++) {
        if (unsafeCharCodeAt(data, i) === quoteCode) {
            if (instr === false) {
                instr = true;
                lastPos = i;
            } else if (unsafeCharCodeAt(data, i - 1) !== backSlashCode) {
                instr = false;
                result.push(data.slice(lastPos + 1, i).replaceAll('\\"', '"'));
            }
        }
    }
    return result;
}

// @ts-ignore
@inline
export function parseBooleanArray<T extends boolean[]>(data: string): T {
    const result = instantiate<T>();
    let lastPos = 1;
    let char = 0;
    for (let i = 1; i < data.length - 1; i++) {
        char = unsafeCharCodeAt(data, i);
        /*// if char == "t" && i+3 == "e"
            if (char === tCode && data.charCodeAt(i + 3) === eCode) {
              //i += 3;
              result.push(parseBoolean<valueof<T>>(data.slice(lastPos, i+2)));
              //i++;
            } else if (char === fCode && data.charCodeAt(i + 4) === eCode) {
              //i += 4;
              result.push(parseBoolean<valueof<T>>(data.slice(lastPos, i+3)));
              //i++;
            }*/
        if (char === tCode || char === fCode) {
            lastPos = i;
        } else if (char === eCode) {
            i++;
            result.push(parseBoolean<valueof<T>>(data.slice(lastPos, i)));
        }
    }
    return result;
}

// @ts-ignore
@inline
export function parseNumberArray<T extends number[]>(data: string): T {
    const result = instantiate<T>();
    let lastPos = 0;
    let char = 0;
    let i = 1;
    for (; i < data.length - 1; i++) {
        char = unsafeCharCodeAt(data, i);
        if ((lastPos === 0 && char >= 48 && char <= 57) || char === 45) {
            lastPos = i;
        } else if ((isSpace(char) || char == commaCode) && lastPos > 0) {
            result.push(parseNumber<valueof<T>>(data.slice(lastPos, i)));
            lastPos = 0;
        }
    }
    for (; i > lastPos - 1; i--) {
        char = unsafeCharCodeAt(data, i);
        if (char !== rightBracketCode) {
            result.push(parseNumber<valueof<T>>(data.slice(lastPos, i + 1)));
            break;
        }
    }
    return result;
}

// @ts-ignore
@inline
export function parseArrayArray<T extends unknown[][]>(data: string): T {
    const result = instantiate<T>();
    let char = 0;
    let lastPos = 0;
    let depth = 1;
    let i = 1;
    // Find start of bracket
    //for (; unsafeCharCodeAt(data, i) !== leftBracketCode; i++) {}
    //i++;
    for (; i < data.length - 1; i++) {
        char = unsafeCharCodeAt(data, i);
        if (char === leftBracketCode) {
            if (depth === 1) {
                lastPos = i;
            }
            // Shifting is 6% faster than incrementing
            depth = depth << 1;
        } else if (char === rightBracketCode) {
            depth = depth >> 1;
            if (depth === 1) {
                i++;
                result.push(JSON.parse<valueof<T>>(data.slice(lastPos, i)));
            }
        }
    }
    return result;
}

// @ts-ignore
@inline
export function parseObjectArray<T extends unknown[][]>(data: string): T {
    const result = instantiate<T>();
    let char = 0;
    let lastPos = 1;
    let depth = 1;
    let i = 1;
    // Find start of bracket
    //for (; unsafeCharCodeAt(data, i) !== leftBracketCode; i++) { }
    //i++;
    for (; i < data.length - 1; i++) {
        char = unsafeCharCodeAt(data, i);
        if (char === leftBraceCode) {
            if (depth === 1) {
                lastPos = i;
            }
            // Shifting is 6% faster than incrementing
            depth = depth << 1;
        } else if (char === rightBraceCode) {
            depth = depth >> 1;
            if (depth === 1) {
                i++;
                result.push(JSON.parse<valueof<T>>(data.slice(lastPos, i)));
            }
        }
    }
    return result;
}
