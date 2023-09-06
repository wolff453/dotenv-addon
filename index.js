const isObjectOrArray = (data) => {
    try {
        return JSON.parse(data)
    } catch (error) {
        return false
    }
}

const isNumber = data => /^\d+$/gm.test(data) && Number(data)

const isBoolean = data => data === 'true'

const isString = data => typeof data === 'string' && data

const transformType = (data) => {
    if (data === 'true' || data === 'false') {
        return isBoolean(data)
    }
    return isObjectOrArray(data) || isNumber(data) || isString(data)
}

const notConvertEnv = (dotenvObject, value, notConvert) => notConvert.some(item => dotenvObject[item] === value)

const transformToObject = (env, notConvert, dotenvObject) => Object.entries(env).forEach(([key, value]) => {
    const values = notConvertEnv(dotenvObject, value, notConvert)
    if (values) {
        return
    }
    if (typeof value === 'object') {
        transformToObject(value, notConvert, dotenvObject)
    }
    if (typeof value === 'string') {
        env[key] = transformType(value)
    }
})

const interpolationMethod = (data) => {
    const regexWithDolar = /\${\w+}/gm.test(data)
    if (regexWithDolar) {
        return '${'
    }
    const regexWithoutDolar = /\{\w+}/gm.test(data)
    if (regexWithoutDolar) {
        return '{'
    }
}

const extractKeyToInterpolate = value => value.match(/(?<={)(\w+)/gm)

const getValueToInterpolate = (data, value) => value.length > 1 ? value.map(item => data[item]) : data[value]

const interpolateWithDolar = valueToInterpolate => '$' + '{' + valueToInterpolate + '}'

const interpolateWithoutDolar = valueToInterpolate => '{' + valueToInterpolate + '}'

const searchValue = (valueToInterpolate, method) => method === '${' ? interpolateWithDolar(valueToInterpolate) : interpolateWithoutDolar(valueToInterpolate)

const interpolateAcrossStrings = (obj, data, method) => Array.isArray(data) ? data.map(item => {
    const extract = extractKeyToInterpolate(item)
    if (extract) {
        const get = obj[extract]
        return item.replace(searchValue(extract, method), get)
    }
    return item
}) : data

const notInterpolateEnv = (dotenvObject, value, notInterpolate) => notInterpolate.some(item => dotenvObject[item] === value)

const interpolateString = (data, dotEnvObject, notInterpolate) => Object.entries(data).forEach(([key, value]) => {
    const notInterpolateEnvs = notInterpolateEnv(dotEnvObject, value, notInterpolate)
    if (notInterpolateEnvs) {
        return
    }
    if (typeof value === 'object') {
        interpolateString(value, dotEnvObject, notInterpolate)
    }
    const method = interpolationMethod(value)
    if (typeof value === 'string' && method) {
        const extract = extractKeyToInterpolate(value)
        const valueToReplace = getValueToInterpolate(dotEnvObject, extract)
        const cross = interpolateAcrossStrings(dotEnvObject, valueToReplace, method)
        if (Array.isArray(cross) && cross.length > 1) {
            let newKey = ''
            cross.forEach((item, index) => {
                if (newKey) {
                    newKey = newKey.replace(searchValue(extract[index], method), item)
                    return
                }
                newKey += value.replace(searchValue(extract[index], method), item)
            })
            data[key] = newKey
            return
        }
        data[key] = value.replace(searchValue(extract, method), cross)
    }
})

const expandEnv = ({ dotEnvObject, config, notConvert = [], notInterpolate = [], interpolateEnv = false }) => {
    transformToObject(config, notConvert, dotEnvObject)
    if (interpolateEnv) {
        interpolateString(config, dotEnvObject, notInterpolate)
    }
    return config
}

module.exports = { expandEnv }