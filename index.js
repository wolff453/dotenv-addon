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

const transformToObject = env => Object.entries(env).forEach(([key, value]) => {
    if (typeof value === 'object') {
        transformToObject(value)
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

const interpolateString = (data, dotEnvObject) => Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object') {
        interpolateString(value, dotEnvObject)
    }
    const method = interpolationMethod(value)
    if (typeof value === 'string' && method) {
        const extract = extractKeyToInterpolate(value)
        const valueToReplace = getValueToInterpolate(dotEnvObject, extract)
        if (Array.isArray(valueToReplace) && valueToReplace.length > 1) {
            let newKey = ''
            valueToReplace.forEach((item, index) => {
                if (newKey) {
                    newKey = newKey.replace(searchValue(extract[index], method), item)
                    return
                }
                newKey += value.replace(searchValue(extract[index], method), item)
            })
            data[key] = newKey
            return
        }
        data[key] = value.replace(searchValue(extract, method), valueToReplace)
    }
})

const expandEnv = ({ dotEnvObject, config, interpolateEnv = false }) => {
    transformToObject(config)
    if (interpolateEnv) {
        interpolateString(config, dotEnvObject)
    }
    return config
}

module.exports = { expandEnv }