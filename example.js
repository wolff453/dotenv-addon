const env = require('dotenv').config()
const { expandEnv } = require('dotenv-addon')

module.exports = expandEnv({
    dotEnvObject: env.parsed,
    config: {
        app: {
            name: process.env.APP_NAME,
            port: process.env.PORT,
            env: process.env.NODE_ENV,
            host: process.env.TEST_ENV_INTERPOLATE,
            booleanConvert: process.env.TEST_BOOLEAN_CONVERT,
            arrayConvert: process.env.TEST_ARRAY_CONVERT,
            objectConvert: process.env.TEST_OBJECT_CONVERT
          },
    },
    interpolateEnv: true
})
