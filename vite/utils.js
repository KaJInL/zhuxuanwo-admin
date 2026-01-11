import _ from 'lodash';
export function parseEnv(env) {
    var envs = _.cloneDeep(env);
    Object.entries(env).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (value == 'true' || value == 'false') {
            envs[key] = value === 'true';
        }
        if (/^\d+$/.test(value)) {
            envs[key] = parseInt(value);
        }
    });
    return envs;
}
